import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BackToDashboardLinkProps {
  className?: string;
}

export function BackToDashboardLink({ className = '' }: BackToDashboardLinkProps) {
  return (
    <Link
      to="/student"
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      Back to dashboard
    </Link>
  );
}
