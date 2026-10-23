import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Ticket } from '../models/Ticket';
import { Feedback } from '../models/Feedback';

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const agents = await User.find({ role: 'AGENT' }).select('-password').sort({ name: 1 });

    // Aggregate active workload and resolved counts
    const activeStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_AGENT', 'REOPENED'];

    const workloadData = await Ticket.aggregate([
      {
        $facet: {
          active: [
            { $match: { assignedAgent: { $exists: true }, status: { $in: activeStatuses } } },
            { $group: { _id: '$assignedAgent', count: { $sum: 1 } } }
          ],
          resolved: [
            { $match: { assignedAgent: { $exists: true }, status: { $in: ['RESOLVED', 'CLOSED'] } } },
            { $group: { _id: '$assignedAgent', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const activeMap = new Map<string, number>();
    const resolvedMap = new Map<string, number>();

    if (workloadData[0]?.active) {
      workloadData[0].active.forEach((item: any) => activeMap.set(item._id.toString(), item.count));
    }
    if (workloadData[0]?.resolved) {
      workloadData[0].resolved.forEach((item: any) => resolvedMap.set(item._id.toString(), item.count));
    }

    const formattedAgents = agents.map((agent) => {
      const id = agent._id.toString();
      return {
        ...agent.toObject(),
        activeTickets: activeMap.get(id) || 0,
        resolvedTickets: resolvedMap.get(id) || 0
      };
    });

    return res.json({
      success: true,
      agents: formattedAgents
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve support agents.',
      error: error.message
    });
  }
};

export const getAgentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await User.findOne({ _id: id, role: 'AGENT' }).select('-password');
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    // Performance metrics
    const tickets = await Ticket.find({ assignedAgent: agent._id });
    const totalAssigned = tickets.length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_CUSTOMER').length;

    // SLA compliance
    const breached = tickets.filter((t) => t.slaStatus === 'BREACHED').length;
    const slaCompliance = totalAssigned > 0 ? Math.round(((totalAssigned - breached) / totalAssigned) * 100) : 100;

    // Agent CSAT
    const ticketIds = tickets.map((t) => t._id);
    const feedbackList = await Feedback.find({ ticket: { $in: ticketIds } });
    const totalRatings = feedbackList.length;
    const avgRating = totalRatings > 0 ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / totalRatings).toFixed(1) : '5.0';
    const satisfied = feedbackList.filter((f) => f.rating >= 4).length;
    const csatPercent = totalRatings > 0 ? Math.round((satisfied / totalRatings) * 100) : 100;

    return res.json({
      success: true,
      agent,
      metrics: {
        totalAssigned,
        resolved,
        open,
        inProgress,
        breached,
        slaCompliance,
        totalFeedback: totalRatings,
        avgRating: Number(avgRating),
        csatScore: csatPercent
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve agent details.',
      error: error.message
    });
  }
};

export const updateAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { availability, skills, phone, company } = req.body;

    // Only Admin can update other agents; an Agent can update their own availability and skills
    if (req.user?.role !== 'ADMIN' && req.user?._id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this agent.' });
    }

    const agent = await User.findOne({ _id: id, role: 'AGENT' });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    if (availability && ['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
      agent.availability = availability;
    }
    if (Array.isArray(skills)) {
      agent.skills = skills;
    }
    if (phone !== undefined) agent.phone = phone;
    if (company !== undefined) agent.company = company;

    await agent.save();

    return res.json({
      success: true,
      message: 'Agent updated successfully.',
      agent
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update agent.',
      error: error.message
    });
  }
};
