// Simple event emitter for redemption progress updates with state persistence
type RedemptionProgressEvent = {
    current: number;
    total: number;
    currentCode?: string;
    status: 'idle' | 'checking' | 'redeeming' | 'done' | 'error';
    results: { code: string; success: boolean; message: string }[];
};

type Listener = (event: RedemptionProgressEvent) => void;

const listeners: Set<Listener> = new Set();

// Store current state so new subscribers can get it immediately
let currentState: RedemptionProgressEvent = {
    current: 0,
    total: 0,
    status: 'idle',
    results: [],
};

export function subscribeToRedemptionProgress(listener: Listener): () => void {
    listeners.add(listener);

    // Always call listener with current state immediately
    // This ensures returning to Dashboard shows current progress or results
    listener(currentState);

    return () => listeners.delete(listener);
}

export function emitRedemptionProgress(event: RedemptionProgressEvent): void {
    currentState = event;
    listeners.forEach((listener) => listener(event));
}

export function getCurrentRedemptionProgress(): RedemptionProgressEvent {
    return currentState;
}

export function resetRedemptionProgress(): void {
    currentState = {
        current: 0,
        total: 0,
        status: 'idle',
        results: [],
    };
    listeners.forEach((listener) => listener(currentState));
}
