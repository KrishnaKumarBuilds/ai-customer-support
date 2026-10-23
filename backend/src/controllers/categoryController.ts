import { Request, Response } from 'express';
import { Category } from '../models/Category';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.json({
      success: true,
      categories
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories.',
      error: error.message
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, defaultPriority, slaHours, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      defaultPriority: defaultPriority || 'MEDIUM',
      slaHours: Number(slaHours || 12),
      icon: icon || 'HelpCircle'
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create category.',
      error: error.message
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, defaultPriority, slaHours, icon, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (defaultPriority) category.defaultPriority = defaultPriority;
    if (slaHours !== undefined) category.slaHours = Number(slaHours);
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return res.json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update category.',
      error: error.message
    });
  }
};
