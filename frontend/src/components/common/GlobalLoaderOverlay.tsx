import React from 'react';
import { useGlobalLoading } from '@/state/loadingProvider';
import Spinner from './Spinner';

const GlobalLoaderOverlay: React.FC = () => {
  const isLoading = useGlobalLoading();

  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 p-6 rounded-md bg-white shadow-lg">
        <Spinner size={40} />
        <span className="text-sm text-gray-700">Loading…</span>
      </div>
    </div>
  );
};

export default GlobalLoaderOverlay;
