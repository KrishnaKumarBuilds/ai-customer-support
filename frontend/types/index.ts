export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  skills: string[];
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  company?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

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

export interface SLAMetrics {
  slaDeadline: string;
  slaStatus: SLAStatus;
  resolutionHours: number;
  timeRemainingMs: number;
  isBreached: boolean;
  isAtRisk: boolean;
  percentElapsed: number;
}

export interface InternalNote {
  _id?: string;
  author: User | string;
  note: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  customer: User;
  assignedAgent?: User;
  subject: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: TicketPriority;
  status: TicketStatus;
  sentiment: TicketSentiment;
  confidence: number;
  slaDeadline: string;
  slaStatus: SLAStatus;
  slaMetrics?: SLAMetrics;
  internalNotes: InternalNote[];
  tags: string[];
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  ticket: string;
  sender: User;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  ticket: Ticket;
  customer: User;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: string;
  ticketId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface SLARule {
  _id: string;
  priority: TicketPriority;
  resolutionHours: number;
  responseHours: number;
  description: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  defaultPriority: TicketPriority;
  slaHours: number;
  icon: string;
  isActive: boolean;
}

export interface AIPrediction {
  category: string;
  priority: TicketPriority;
  sentiment: TicketSentiment;
  confidence: number;
  suggested_skill: string;
}

export interface AdminStats {
  totalCustomers: number;
  totalAgents: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaBreaches: number;
  avgResolutionHours: number;
  csatScore: number;
  slaCompliance: number;
}

export interface AgentMetrics {
  totalAssigned: number;
  resolved: number;
  open: number;
  inProgress: number;
  breached: number;
  slaCompliance: number;
  totalFeedback: number;
  avgRating: number;
  csatScore: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}
