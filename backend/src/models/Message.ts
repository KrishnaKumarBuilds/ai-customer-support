import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  ticket: Types.ObjectId;
  sender: Types.ObjectId;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    attachments: {
      type: [String],
      default: []
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
