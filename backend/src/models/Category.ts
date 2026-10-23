import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  slaHours: number;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    defaultPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    slaHours: { type: Number, default: 12 },
    icon: { type: String, default: 'HelpCircle' },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
