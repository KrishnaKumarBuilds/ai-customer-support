import { SLA, TicketPriority } from '../models/SLA';
import { ITicket, SLAStatus } from '../models/Ticket';

export interface SLAMetrics {
  slaDeadline: Date;
  slaStatus: SLAStatus;
  resolutionHours: number;
  timeRemainingMs: number;
  isBreached: boolean;
  isAtRisk: boolean;
  percentElapsed: number;
}

export class SLAService {
  private static DEFAULT_HOURS: Record<TicketPriority, number> = {
    CRITICAL: 2,
    HIGH: 4,
    MEDIUM: 12,
    LOW: 24
  };

  /**
   * Determine SLA resolution hours for a priority
   */
  public static async getResolutionHours(priority: TicketPriority): Promise<number> {
    try {
      const rule = await SLA.findOne({ priority, isActive: true });
      if (rule && rule.resolutionHours > 0) {
        return rule.resolutionHours;
      }
    } catch (e) {
      // ignore, use default
    }
    return this.DEFAULT_HOURS[priority] || 12;
  }

  /**
   * Calculate exact deadline Date
   */
  public static async calculateDeadline(priority: TicketPriority, startDate: Date = new Date()): Promise<Date> {
    const hours = await this.getResolutionHours(priority);
    const deadline = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
    return deadline;
  }

  /**
   * Evaluate SLA status and metrics for a ticket
   */
  public static evaluateTicketSLA(ticket: ITicket): SLAMetrics {
    const now = Date.now();
    const created = new Date(ticket.createdAt || now).getTime();
    const deadline = new Date(ticket.slaDeadline).getTime();
    const isFinished = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

    const totalDuration = Math.max(1, deadline - created);
    const timeRemainingMs = deadline - now;
    const elapsedMs = now - created;
    const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDuration) * 100)));

    let slaStatus: SLAStatus = 'ON_TRACK';

    if (isFinished) {
      // If it was resolved after the deadline, it was breached before resolution
      if (ticket.resolvedAt && new Date(ticket.resolvedAt).getTime() > deadline) {
        slaStatus = 'BREACHED';
      } else {
        slaStatus = 'COMPLETED';
      }
    } else if (now > deadline) {
      slaStatus = 'BREACHED';
    } else if (timeRemainingMs < totalDuration * 0.25 || timeRemainingMs < 3600000) {
      slaStatus = 'AT_RISK';
    } else {
      slaStatus = 'ON_TRACK';
    }

    return {
      slaDeadline: ticket.slaDeadline,
      slaStatus,
      resolutionHours: Math.round(totalDuration / (1000 * 60 * 60)),
      timeRemainingMs,
      isBreached: slaStatus === 'BREACHED',
      isAtRisk: slaStatus === 'AT_RISK',
      percentElapsed
    };
  }
}
