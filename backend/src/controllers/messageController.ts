import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Message } from '../models/Message';
import { Ticket } from '../models/Ticket';
import { NotificationService } from '../services/notificationService';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (req.user?.role === 'CUSTOMER' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const query: any = { ticket: id };
    // Customers cannot view internal notes / messages
    if (req.user?.role === 'CUSTOMER') {
      query.isInternal = false;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      messages
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages.',
      error: error.message
    });
  }
};

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, attachments, isInternal = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Role check for customer
    if (req.user.role === 'CUSTOMER') {
      if (ticket.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      if (isInternal) {
        return res.status(403).json({ success: false, message: 'Customers cannot send internal notes.' });
      }
    }

    const newMessage = await Message.create({
      ticket: ticket._id,
      sender: req.user._id,
      message: message.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      isInternal: Boolean(isInternal)
    });

    // Update ticket status dynamically depending on sender
    if (!isInternal) {
      if (req.user.role === 'CUSTOMER') {
        if (ticket.status === 'WAITING_FOR_CUSTOMER' || ticket.status === 'RESOLVED') {
          ticket.status = 'IN_PROGRESS';
        }
      } else if (req.user.role === 'AGENT' || req.user.role === 'ADMIN') {
        if (ticket.status === 'OPEN' || ticket.status === 'WAITING_FOR_AGENT') {
          ticket.status = 'WAITING_FOR_CUSTOMER';
        }
      }
      await ticket.save();
    }

    // Notifications
    if (!isInternal) {
      if (req.user.role === 'CUSTOMER' && ticket.assignedAgent) {
        await NotificationService.notify({
          recipientId: ticket.assignedAgent,
          title: `Customer Replied: ${ticket.ticketNumber}`,
          message: `${req.user.name} sent a reply on "${ticket.subject}"`,
          type: 'NEW_REPLY',
          ticketId: ticket._id
        });
      } else if (req.user.role !== 'CUSTOMER') {
        await NotificationService.notify({
          recipientId: ticket.customer,
          title: `Agent Replied: ${ticket.ticketNumber}`,
          message: `${req.user.name} responded to your ticket "${ticket.subject}"`,
          type: 'NEW_REPLY',
          ticketId: ticket._id
        });
      }
    }

    const populated = await Message.findById(newMessage._id).populate('sender', 'name email role avatar');

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      newMessage: populated,
      updatedTicketStatus: ticket.status
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.',
      error: error.message
    });
  }
};
