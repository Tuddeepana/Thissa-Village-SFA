export type LoaderType = 'global' | 'local' | 'none';

export interface LoadingSnapshot {
  globalCount: number;
  localCounts: Map<string, number>;
}

class LoadingStore {
  private globalCount = 0;
  private localCounts = new Map<string, number>();
  private listeners = new Set<() => void>();
  private version = 0;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.version++;
    for (const l of this.listeners) l();
  }

  getVersion(): number {
    return this.version;
  }

  getSnapshot(): LoadingSnapshot {
    return {
      globalCount: this.globalCount,
      localCounts: this.localCounts,
    };
  }

  incrementGlobal() {
    this.globalCount++;
    this.emit();
  }

  decrementGlobal() {
    if (this.globalCount > 0) {
      this.globalCount--;
      this.emit();
    }
  }

  incrementLocal(key: string) {
    const cur = this.localCounts.get(key) ?? 0;
    this.localCounts.set(key, cur + 1);
    this.emit();
  }

  decrementLocal(key: string) {
    const cur = this.localCounts.get(key) ?? 0;
    const next = Math.max(0, cur - 1);
    if (next === 0) this.localCounts.delete(key); else this.localCounts.set(key, next);
    this.emit();
  }

  isGlobalLoading() {
    return this.globalCount > 0;
  }

  isLocalLoading(key: string) {
    return (this.localCounts.get(key) ?? 0) > 0;
  }
}

export const loadingStore = new LoadingStore();
