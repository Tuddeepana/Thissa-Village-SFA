import React from 'react';
import { useLocalLoader } from '@/state/loadingProvider';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * LocalLoader wraps children and shows a skeleton while the loader key is active.
 * Pass a custom skeleton via renderSkeleton for specialized layouts.
 */
const LocalLoader: React.FC<{
  loaderKey: string;
  renderSkeleton?: () => React.ReactNode;
  children: React.ReactNode;
}> = ({ loaderKey, renderSkeleton, children }) => {
  const loading = useLocalLoader(loaderKey);

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
