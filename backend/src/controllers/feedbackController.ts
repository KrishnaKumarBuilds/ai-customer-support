import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Feedback } from '../models/Feedback';
import { Ticket } from '../models/Ticket';
import { NotificationService } from '../services/notificationService';

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, rating, comment } = req.body;

    if (!ticketId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'ticketId and rating are required.'
      });
    }

    const numRating = parseInt(String(rating));
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Customer can only rate their own tickets
    if (req.user.role === 'CUSTOMER' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only review your own tickets.' });
    }

    // Check if feedback already exists
    const existing = await Feedback.findOne({ ticket: ticket._id });
    if (existing) {
      existing.rating = numRating;
      existing.comment = comment || '';
      await existing.save();
      return res.json({
        success: true,
        message: 'Feedback updated successfully.',
        feedback: existing
      });
    }

    const feedback = await Feedback.create({
      ticket: ticket._id,
      customer: req.user._id,
      rating: numRating,
      comment: comment || ''
    });

    // Notify assigned agent about received feedback
    if (ticket.assignedAgent) {
      await NotificationService.notify({
        recipientId: ticket.assignedAgent,
        title: `Customer Rated Ticket ${ticket.ticketNumber}`,
        message: `Customer awarded ${numRating} stars: "${comment || 'No comment provided'}"`,
        type: 'FEEDBACK_RECEIVED',
        ticketId: ticket._id
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you!',
      feedback
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback.',
      error: error.message
    });
  }
};

export const getFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.query;
    const query: any = {};
    if (ticketId) query.ticket = ticketId;

    const feedbackList = await Feedback.find(query)
      .populate('customer', 'name email company')
      .populate('ticket', 'ticketNumber subject category priority assignedAgent')
      .sort({ createdAt: -1 });

    const total = feedbackList.length;
    const satisfied = feedbackList.filter((f) => f.rating >= 4).length;
    const csatScore = total > 0 ? Math.round((satisfied / total) * 100) : 100;
    const avgRating = total > 0 ? Number((feedbackList.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(2)) : 5.0;

    const distribution = {
      5: feedbackList.filter((f) => f.rating === 5).length,
      4: feedbackList.filter((f) => f.rating === 4).length,
      3: feedbackList.filter((f) => f.rating === 3).length,
      2: feedbackList.filter((f) => f.rating === 2).length,
      1: feedbackList.filter((f) => f.rating === 1).length
    };

    return res.json({
      success: true,
      summary: {
        totalResponses: total,
        csatScore,
        avgRating,
        satisfiedResponses: satisfied,
        ratingDistribution: distribution
      },
      feedback: feedbackList
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback.',
      error: error.message
    });
  }
};
