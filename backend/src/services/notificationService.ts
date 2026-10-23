import { Notification, NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

export class NotificationService {
  public static async notify(params: {
    recipientId: string | mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    ticketId?: string | mongoose.Types.ObjectId;
    link?: string;
  }) {
    try {
      const notif = await Notification.create({
        recipient: params.recipientId,
        title: params.title,
        message: params.message,
        type: params.type,
        ticketId: params.ticketId,
        link: params.link || (params.ticketId ? `/tickets/${params.ticketId}` : '')
      });
      return notif;
    } catch (e: any) {
      console.error('[NOTIFICATION SERVICE] Error creating notification:', e.message);
      return null;
    }
  }
}
