import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, differenceInMilliseconds } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy HH:mm');
}

export function formatRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatSLATime(deadlineString: string): string {
  const deadline = new Date(deadlineString);
  const now = new Date();
  const diffMs = differenceInMilliseconds(deadline, now);

  if (diffMs <= 0) {
    const overMs = Math.abs(diffMs);
    return `Overdue by ${formatDuration(overMs)}`;
  }
  return formatDuration(diffMs) + ' remaining';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getPriorityClass(priority: string) {
  switch (priority) {
    case 'CRITICAL': return 'badge-critical';
    case 'HIGH': return 'badge-high';
    case 'MEDIUM': return 'badge-medium';
    case 'LOW': return 'badge-low';
    default: return 'badge-low';
  }
}

export function getStatusClass(status: string) {
  switch (status) {
    case 'OPEN': return 'badge-open';
    case 'IN_PROGRESS': return 'badge-in-progress';
    case 'WAITING_FOR_CUSTOMER':
    case 'WAITING_FOR_AGENT': return 'badge-waiting';
    case 'RESOLVED': return 'badge-resolved';
    case 'CLOSED': return 'badge-closed';
    case 'REOPENED': return 'badge-open';
    default: return 'badge-open';
  }
}

export function getSLAClass(slaStatus: string) {
  switch (slaStatus) {
    case 'ON_TRACK': return 'sla-on-track';
    case 'AT_RISK': return 'sla-at-risk';
    case 'BREACHED': return 'sla-breached';
    case 'COMPLETED': return 'sla-completed';
    default: return 'sla-on-track';
  }
}

export function getSentimentClass(sentiment: string) {
  switch (sentiment) {
    case 'Positive': return 'sentiment-positive';
    case 'Neutral': return 'sentiment-neutral';
    case 'Negative': return 'sentiment-negative';
    default: return 'sentiment-neutral';
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#22c55e';
    default: return '#94a3b8';
  }
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateAvatarUrl(name: string) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1d4ed8&color=fff&size=64&bold=true`;
}
