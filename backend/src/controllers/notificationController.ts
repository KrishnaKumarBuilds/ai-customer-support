import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    return res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: error.message
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    return res.json({
      success: true,
      notification
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message
    });
  }
};
