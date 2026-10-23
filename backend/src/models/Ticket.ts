import mongoose, { Document, Schema, Types } from 'mongoose';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'WAITING_FOR_AGENT'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketSentiment = 'Positive' | 'Neutral' | 'Negative';
export type SLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'COMPLETED';

export interface IInternalNote {
  _id?: Types.ObjectId;
  author: Types.ObjectId;
  note: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketNumber: string;
  customer: Types.ObjectId;
  assignedAgent?: Types.ObjectId;
  subject: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: TicketPriority;
  status: TicketStatus;
  sentiment: TicketSentiment;
  confidence: number;
  slaDeadline: Date;
  slaStatus: SLAStatus;
  internalNotes: IInternalNote[];
  tags: string[];
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InternalNoteSchema = new Schema<IInternalNote>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
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
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    subcategory: {
      type: String,
      default: ''
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'IN_PROGRESS',
        'WAITING_FOR_CUSTOMER',
        'WAITING_FOR_AGENT',
        'RESOLVED',
        'CLOSED',
        'REOPENED'
      ],
      default: 'OPEN',
      index: true
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral'
    },
    confidence: {
      type: Number,
      default: 0.85
    },
    slaDeadline: {
      type: Date,
      required: true,
      index: true
    },
    slaStatus: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'BREACHED', 'COMPLETED'],
      default: 'ON_TRACK',
      index: true
    },
    internalNotes: {
      type: [InternalNoteSchema],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    resolvedAt: {
      type: Date
    },
    closedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Virtual calculation for dynamic SLA status check helper
TicketSchema.methods.calculateSLAStatus = function (): SLAStatus {
  if (this.status === 'RESOLVED' || this.status === 'CLOSED') {
    return 'COMPLETED';
  }
  const now = new Date().getTime();
  const deadline = new Date(this.slaDeadline).getTime();
  const created = new Date(this.createdAt || Date.now()).getTime();

  if (now > deadline) {
    return 'BREACHED';
  }

  const totalWindow = deadline - created;
  const remaining = deadline - now;

  // If less than 25% of total time remaining, mark AT_RISK
  if (remaining < totalWindow * 0.25 || remaining < 1000 * 60 * 60) {
    return 'AT_RISK';
  }

  return 'ON_TRACK';
};

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
