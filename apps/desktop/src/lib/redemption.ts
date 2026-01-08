import { getShiftClient } from './shift';
import { addFailedCode, removeFailedCode, addRedeemedCode, addToHistory } from './store';
import { ShiftCode } from '@yascar/types';

export interface RedemptionResult {
    success: boolean;
    message: string;
    expired?: boolean;
}

export async function redeemShiftCode(code: ShiftCode, isRetry: boolean = false): Promise<RedemptionResult> {
    const client = getShiftClient();

    // If retrying, remove from failed list first
    if (isRetry) {
        await removeFailedCode(code.code);
    }

    // Check the code to get redemption forms
    const checkResult = await client.checkCode(code.code);
    if (!checkResult.valid || !checkResult.forms?.length) {
        const reason = checkResult.reason || 'Code not valid';

        // Check if code is expired - if so, mark as redeemed to remove from available
        if (reason.toLowerCase().includes('expired')) {
            await addRedeemedCode(code.code);
            return { success: false, message: reason, expired: true };
        }

        await addFailedCode(code.code, reason);
        return { success: false, message: reason };
    }

    // Try to redeem for each available form (game/platform combo)
    const successfulPlatforms: string[] = [];
    let expiredMessage: string | null = null;

    for (const form of checkResult.forms) {
        const result = await client.redeemCode(form);

        // Check if the redemption response indicates expired
        if (result.reason?.toLowerCase().includes('expired')) {
            expiredMessage = result.reason;
            continue; // Try other platforms, they might work
        }

        if (result.success) {
            successfulPlatforms.push(`${form.game} (${form.platform})`);
            await addToHistory({
                code: code.code,
                redeemedAt: new Date().toISOString(),
                game: form.game,
                platform: form.platform,
                success: true,
            });
        }
    }

    // If we had any successes
    if (successfulPlatforms.length > 0) {
        await removeFailedCode(code.code);
        return { success: true, message: `Redeemed on: ${successfulPlatforms.join(', ')}` };
    }

    // If all platforms said expired
    if (expiredMessage) {
        await addRedeemedCode(code.code);
        await removeFailedCode(code.code);
        return { success: false, message: expiredMessage, expired: true };
    }

    const failReason = 'Failed to redeem on any platform';
    await addFailedCode(code.code, failReason);
    return { success: false, message: failReason };
}
