import { Request, Response } from 'express';
import { AIService } from '../services/aiService';

export const classify = async (req: Request, res: Response) => {
  try {
    const { subject = '', description = '' } = req.body;

    if (!subject.trim() && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least a subject or description to classify.'
      });
    }

    const prediction = await AIService.classifyTicket(subject, description);

    return res.json({
      success: true,
      prediction
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to classify ticket content.',
      error: error.message
    });
  }
};
