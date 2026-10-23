import mongoose, { Document, Schema } from 'mongoose';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ISLA extends Document {
  priority: TicketPriority;
  resolutionHours: number;
  responseHours: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SLASchema = new Schema<ISLA>(
  {
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      unique: true
    },
    resolutionHours: { type: Number, required: true },
    responseHours: { type: Number, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const SLA = mongoose.model<ISLA>('SLA', SLASchema);
