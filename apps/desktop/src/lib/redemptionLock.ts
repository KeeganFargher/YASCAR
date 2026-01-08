// Simple shared lock to prevent concurrent redemption operations
let redemptionInProgress = false;

export function isRedemptionInProgress(): boolean {
    return redemptionInProgress;
}

export function setRedemptionInProgress(value: boolean): void {
    redemptionInProgress = value;
    console.log(`[RedemptionLock] ${value ? 'LOCKED' : 'UNLOCKED'}`);
}
