import { createContext, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { loadingStore } from './loadingStore';

interface LoadingContextValue {
  isGlobalLoading: boolean;
  isLocalLoading: (key: string) => boolean;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  // Force re-render when store changes
  const version = useSyncExternalStore(
    loadingStore.subscribe.bind(loadingStore),
    () => loadingStore.getVersion(),
    () => loadingStore.getVersion()
  );

  const value: LoadingContextValue = useMemo(() => ({
    isGlobalLoading: loadingStore.isGlobalLoading(),
    isLocalLoading: (key: string) => loadingStore.isLocalLoading(key),
  }), [version]);

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useGlobalLoading must be used within LoadingProvider');
  return ctx.isGlobalLoading;
};

export const useLocalLoader = (key: string) => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLocalLoader must be used within LoadingProvider');
  return ctx.isLocalLoading(key);
};
