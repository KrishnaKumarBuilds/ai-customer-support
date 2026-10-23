import { Request, Response } from 'express';
import { SLA } from '../models/SLA';

export const getSLARules = async (req: Request, res: Response) => {
  try {
    const rules = await SLA.find().sort({ resolutionHours: 1 });
    return res.json({
      success: true,
      rules
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve SLA rules.',
      error: error.message
    });
  }
};

export const createSLARule = async (req: Request, res: Response) => {
  try {
    const { priority, resolutionHours, responseHours, description } = req.body;
    if (!priority || !resolutionHours) {
      return res.status(400).json({ success: false, message: 'Priority and resolutionHours are required.' });
    }

    const existing = await SLA.findOne({ priority });
    if (existing) {
      return res.status(400).json({ success: false, message: `SLA rule for ${priority} already exists.` });
    }

    const rule = await SLA.create({
      priority,
      resolutionHours: Number(resolutionHours),
      responseHours: Number(responseHours || 1),
      description: description || ''
    });

    return res.status(201).json({
      success: true,
      message: 'SLA rule created successfully.',
      rule
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create SLA rule.',
      error: error.message
    });
  }
};

export const updateSLARule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionHours, responseHours, description, isActive } = req.body;

    const rule = await SLA.findById(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'SLA rule not found.' });
    }

    if (resolutionHours !== undefined) rule.resolutionHours = Number(resolutionHours);
    if (responseHours !== undefined) rule.responseHours = Number(responseHours);
    if (description !== undefined) rule.description = description;
    if (isActive !== undefined) rule.isActive = Boolean(isActive);

    await rule.save();

    return res.json({
      success: true,
      message: 'SLA rule updated successfully.',
      rule
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update SLA rule.',
      error: error.message
    });
  }
};
