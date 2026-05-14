import { Construction } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from './empty-state.tsx';

export function ComingSoon({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      icon={Construction}
      title={title}
      description={
        description ??
        'This screen is part of the next iteration. The backend route is ready; the UI is on the way.'
      }
      action={action}
    />
  );
}
