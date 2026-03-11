import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export const TableLoadingState: React.FC<{ colSpan: number; message?: string }> = ({
  colSpan,
  message = 'Loading data...'
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12">
        <LoadingState message={message} />
      </td>
    </tr>
  );
};

export default LoadingState;

