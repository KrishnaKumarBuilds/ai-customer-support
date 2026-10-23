import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'TICKET_ASSIGNED'
  | 'STATUS_CHANGE'
  | 'NEW_REPLY'
  | 'SLA_BREACH'
  | 'FEEDBACK_RECEIVED'
  | 'GENERAL';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  ticketId?: Types.ObjectId;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'TICKET_ASSIGNED',
        'STATUS_CHANGE',
        'NEW_REPLY',
        'SLA_BREACH',
        'FEEDBACK_RECEIVED',
        'GENERAL'
      ],
      default: 'GENERAL'
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
