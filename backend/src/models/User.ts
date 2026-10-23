import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';
export type AgentAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  skills: string[];
  availability: AgentAvailability;
  activeTicketCount: number;
  avatar?: string;
  phone?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'AGENT', 'CUSTOMER'],
      default: 'CUSTOMER',
      index: true
    },
    skills: {
      type: [String],
      default: []
    },
    availability: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
      default: 'AVAILABLE'
    },
    activeTicketCount: {
      type: Number,
      default: 0
    },
    avatar: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Method to return user info without password
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
