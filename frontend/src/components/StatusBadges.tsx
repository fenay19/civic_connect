import { Priority, Sentiment, Status, Category, CATEGORIES } from '@/types/grievance';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    pending: { label: 'Pending', className: 'bg-status-pending text-status-pending-foreground' },
    in_progress: { label: 'In Progress', className: 'bg-status-progress text-status-progress-foreground' },
    resolved: { label: 'Resolved', className: 'bg-status-resolved text-status-resolved-foreground' },
  };

  const { label, className: statusClass } = config[status];

  return (
    <Badge className={cn(statusClass, 'font-medium', className)}>
      {label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = {
    high: { label: 'High', className: 'bg-status-high text-status-high-foreground' },
    medium: { label: 'Medium', className: 'bg-status-medium text-status-medium-foreground' },
    low: { label: 'Low', className: 'bg-status-low text-status-low-foreground' },
  };

  const { label, className: priorityClass } = config[priority];

  return (
    <Badge className={cn(priorityClass, 'font-medium', className)}>
      {label}
    </Badge>
  );
}

interface SentimentBadgeProps {
  sentiment: Sentiment;
  className?: string;
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  const config = {
    negative: { label: 'Negative', className: 'bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative' },
    neutral: { label: 'Neutral', className: 'bg-sentiment-neutral/20 text-sentiment-neutral border-sentiment-neutral' },
    positive: { label: 'Positive', className: 'bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive' },
  };

  const { label, className: sentimentClass } = config[sentiment];

  return (
    <Badge variant="outline" className={cn(sentimentClass, 'font-medium', className)}>
      {label}
    </Badge>
  );
}

interface CategoryBadgeProps {
  category: Category;
  language?: 'en' | 'hi';
  className?: string;
}

export function CategoryBadge({ category, language = 'en', className }: CategoryBadgeProps) {
  const label = language === 'hi' ? CATEGORIES[category].labelHi : CATEGORIES[category].label;

  return (
    <Badge variant="secondary" className={cn('font-medium', className)}>
      {label}
    </Badge>
  );
}
