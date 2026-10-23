import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFeedback extends Document {
  ticket: Types.ObjectId;
  customer: Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
