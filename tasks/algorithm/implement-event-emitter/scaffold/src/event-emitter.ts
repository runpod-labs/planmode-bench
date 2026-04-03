type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  // Implement: on(event, listener) - register listener, return unsubscribe function
  on(event: string, listener: Listener): () => void {
    throw new Error("Not implemented");
  }

  // Implement: once(event, listener) - listener fires only once
  once(event: string, listener: Listener): void {
    throw new Error("Not implemented");
  }

  // Implement: emit(event, ...args) - call all listeners, return true if any existed
  emit(event: string, ...args: unknown[]): boolean {
    throw new Error("Not implemented");
  }

  // Implement: off(event, listener) - remove specific listener
  off(event: string, listener: Listener): void {
    throw new Error("Not implemented");
  }

  // Implement: removeAllListeners(event?) - remove all or per-event
  removeAllListeners(event?: string): void {
    throw new Error("Not implemented");
  }

  // Implement: listenerCount(event) - return count
  listenerCount(event: string): number {
    throw new Error("Not implemented");
  }

  // Implement: eventNames() - return array of events with listeners
  eventNames(): string[] {
    throw new Error("Not implemented");
  }
}
