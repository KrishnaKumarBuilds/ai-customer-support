import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Ticket, ITicket, TicketPriority, TicketStatus } from '../models/Ticket';
import { User } from '../models/User';
import { AIService } from '../services/aiService';
import { RoutingService } from '../services/routingService';
import { SLAService } from '../services/slaService';
import { NotificationService } from '../services/notificationService';

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description, categoryOverride, priorityOverride, tags, subcategory } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required.'
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // 1. AI Classification
    const aiResult = await AIService.classifyTicket(subject, description);

    const finalCategory = categoryOverride || aiResult.category;
    const finalPriority = (priorityOverride || aiResult.priority) as TicketPriority;
    const sentiment = aiResult.sentiment;
    const confidence = aiResult.confidence;
    const suggestedSkill = aiResult.suggested_skill;

    // 2. SLA Calculation
    const slaDeadline = await SLAService.calculateDeadline(finalPriority);

    // 3. Automated Intelligent Agent Routing
    const assignedAgent = await RoutingService.findBestAgent(finalCategory, suggestedSkill, finalPriority);

    // 4. Generate Ticket Number
    const count = await Ticket.countDocuments();
    const ticketNumber = `TCK-${(count + 1001).toString()}`;

    // 5. Create Ticket
    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user._id,
      assignedAgent: assignedAgent ? assignedAgent._id : undefined,
      subject,
      description,
      category: finalCategory,
      subcategory: subcategory || '',
      priority: finalPriority,
      status: 'OPEN',
      sentiment,
      confidence,
      slaDeadline,
      slaStatus: 'ON_TRACK',
      tags: Array.isArray(tags) ? tags : [],
      internalNotes: []
    });

    // 6. Notify Assigned Agent if present
    if (assignedAgent) {
      await NotificationService.notify({
        recipientId: assignedAgent._id,
        title: `New Ticket Assigned: ${ticketNumber}`,
        message: `Priority ${finalPriority} ticket in category '${finalCategory}' assigned to you: "${subject}"`,
        type: 'TICKET_ASSIGNED',
        ticketId: ticket._id
      });
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customer', 'name email company')
      .populate('assignedAgent', 'name email skills availability');

    return res.status(201).json({
      success: true,
      message: 'Ticket created and analyzed successfully.',
      ticket: populatedTicket,
      aiInsights: {
        category: finalCategory,
        priority: finalPriority,
        sentiment,
        confidence,
        suggestedSkill,
        routedAgent: assignedAgent ? assignedAgent.name : 'Unassigned'
      }
    });
  } catch (error: any) {
    console.error('[TICKET CONTROLLER] Error creating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ticket.',
      error: error.message
    });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      status,
      priority,
      category,
      sentiment,
      slaStatus,
      assignedToMe,
      agentId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    // Role-based access control filters
    if (req.user.role === 'CUSTOMER') {
      query.customer = req.user._id;
    } else if (req.user.role === 'AGENT') {
      if (assignedToMe === 'true') {
        query.assignedAgent = req.user._id;
      }
      // If agent doesn't specify assignedToMe, they can view assigned or unassigned, or query by agent
      if (agentId) {
        query.assignedAgent = agentId;
      }
    } else if (req.user.role === 'ADMIN') {
      if (agentId) {
        query.assignedAgent = agentId;
      }
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (sentiment) query.sentiment = sentiment;

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { ticketNumber: searchRegex },
        { subject: searchRegex },
        { description: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit))));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const totalTickets = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('customer', 'name email company')
      .populate('assignedAgent', 'name email skills availability')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Dynamically update SLA statuses in memory and database if needed
    const evaluatedTickets = tickets.map((t) => {
      const metrics = SLAService.evaluateTicketSLA(t);
      t.slaStatus = metrics.slaStatus;
      return {
        ...t.toObject(),
        slaStatus: metrics.slaStatus,
        slaMetrics: metrics
      };
    });

    // Filter by slaStatus post-evaluation if requested
    const filteredTickets = slaStatus
      ? evaluatedTickets.filter((t) => t.slaStatus === slaStatus)
      : evaluatedTickets;

    return res.json({
      success: true,
      total: totalTickets,
      page: pageNum,
      totalPages: Math.ceil(totalTickets / limitNum),
      tickets: filteredTickets
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tickets.',
      error: error.message
    });
  }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id)
      .populate('customer', 'name email company phone')
      .populate('assignedAgent', 'name email skills availability')
      .populate('internalNotes.author', 'name email role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Customer can only view their own ticket
    if (req.user?.role === 'CUSTOMER' && ticket.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this ticket.' });
    }

    const slaMetrics = SLAService.evaluateTicketSLA(ticket);
    ticket.slaStatus = slaMetrics.slaStatus;

    const ticketObj: any = ticket.toObject();
    ticketObj.slaStatus = slaMetrics.slaStatus;
    ticketObj.slaMetrics = slaMetrics;

    // Hide internal notes from customer
    if (req.user?.role === 'CUSTOMER') {
      ticketObj.internalNotes = [];
    }

    return res.json({
      success: true,
      ticket: ticketObj
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve ticket details.',
      error: error.message
    });
  }
};

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: TicketStatus[] = [
      'OPEN',
      'IN_PROGRESS',
      'WAITING_FOR_CUSTOMER',
      'WAITING_FOR_AGENT',
      'RESOLVED',
      'CLOSED',
      'REOPENED'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Role check: Customers can only REOPEN or CLOSE their own tickets
    if (req.user?.role === 'CUSTOMER') {
      if (ticket.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      if (!['CLOSED', 'REOPENED'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Customers can only close or reopen tickets.'
        });
      }
    }

    const previousStatus = ticket.status;
    ticket.status = status;

    if (status === 'RESOLVED') {
      ticket.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      ticket.closedAt = new Date();
    } else if (status === 'REOPENED') {
      ticket.resolvedAt = undefined;
      ticket.closedAt = undefined;
    }

    const slaMetrics = SLAService.evaluateTicketSLA(ticket);
    ticket.slaStatus = slaMetrics.slaStatus;

    await ticket.save();

    // Notify Customer about status change
    await NotificationService.notify({
      recipientId: ticket.customer,
      title: `Ticket ${ticket.ticketNumber} Status Updated`,
      message: `Your ticket status was changed from ${previousStatus} to ${status}.`,
      type: 'STATUS_CHANGE',
      ticketId: ticket._id
    });

    return res.json({
      success: true,
      message: `Ticket status successfully updated to ${status}.`,
      ticket
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status.',
      error: error.message
    });
  }
};

export const assignTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required.' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const agent = await User.findOne({ _id: agentId, role: 'AGENT' });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Support agent not found.' });
    }

    ticket.assignedAgent = agent._id as any;
    if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }
    await ticket.save();

    await NotificationService.notify({
      recipientId: agent._id,
      title: `Ticket Reassigned: ${ticket.ticketNumber}`,
      message: `Ticket "${ticket.subject}" has been assigned to you.`,
      type: 'TICKET_ASSIGNED',
      ticketId: ticket._id
    });

    return res.json({
      success: true,
      message: `Ticket assigned to agent ${agent.name}.`,
      ticket
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket.',
      error: error.message
    });
  }
};

export const addInternalNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
    }

    if (!req.user || req.user.role === 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Only agents and admins can add internal notes.' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.internalNotes.push({
      author: req.user._id as any,
      note,
      createdAt: new Date()
    });

    await ticket.save();

    const updated = await Ticket.findById(id).populate('internalNotes.author', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Internal note added.',
      internalNotes: updated?.internalNotes
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add internal note.',
      error: error.message
    });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    return res.json({
      success: true,
      message: 'Ticket deleted successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete ticket.',
      error: error.message
    });
  }
};
