import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * LocalLoader shows skeleton while loading prop is true.
 * Pass a custom skeleton via renderSkeleton for specialized layouts.
 */
const LocalLoader: React.FC<{
  loading?: boolean;
  loaderKey?: string; // kept for backward compatibility, but ignored
  renderSkeleton?: () => React.ReactNode;
  children: React.ReactNode;
}> = ({ loading = false, renderSkeleton, children }) => {

  if (!loading) return <>{children}</>;

  if (renderSkeleton) return <>{renderSkeleton()}</>;

  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-2/3" />
    </div>
  );
};

export default LocalLoader;
