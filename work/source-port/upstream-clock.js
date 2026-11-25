// @effect-diagnostics globalTimers:off globalDate:off - Render clocks for React hooks, outside an Effect runtime.
// setTimeout fires immediately for delays beyond a signed 32-bit int.
const MAX_TIMEOUT_MS = 2_147_483_647;
function makeTickStore(read, periodMs) {
    let value = read();
    let timer;
    const listeners = new Set();
    // Each tick lands on a wall-clock boundary so every subscriber updates in
    // the same frame instead of each drifting on its own phase.
    const schedule = () => {
        timer = setTimeout(() => {
            timer = undefined;
            const next = read();
            if (next !== value) {
                value = next;
                for (const listener of listeners)
                    listener();
            }
            // Listeners may unsubscribe (stopping the clock) or resubscribe (arming
            // a fresh timer) while notified; only continue a clock nobody re-armed.
            if (listeners.size > 0 && timer === undefined)
                schedule();
        }, periodMs - (Date.now() % periodMs));
    };
    return {
        subscribe: (listener) => {
            if (listeners.size === 0) {
                value = read();
                schedule();
            }
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    clearTimeout(timer);
                    timer = undefined;
                }
            };
        },
        getSnapshot: () => {
            if (timer === undefined)
                value = read();
            return value;
        },
    };
}
/** Epoch ms floored to the second, advancing on each wall-clock second. */
export const secondTick = makeTickStore(() => Math.floor(Date.now() / 1000) * 1000, 1000);
/** ISO timestamp truncated to the minute (`YYYY-MM-DDTHH:mm`). */
export const minuteTick = makeTickStore(() => new Date().toISOString().slice(0, 16), 60_000);
// How far each environment's clock runs ahead of this one. Timers read it on
// every tick, so a reconnect's new reading lands without a re-render.
const serverClockOffsets = new Map();
/**
 * The host stamped `serverTimeMs` between the request and its reply, so the
 * offset lies within that window. Keep the one nearest 0, so clocks that agree
 * read as 0 instead of shifting every timer by network latency.
 */
export function recordServerClock(environmentId, sample) {
    const { serverTimeMs, requestedAtMs, receivedAtMs } = sample;
    if (serverTimeMs === undefined || !Number.isFinite(serverTimeMs)) {
        serverClockOffsets.delete(environmentId);
        return;
    }
    serverClockOffsets.set(environmentId, serverTimeMs > receivedAtMs
        ? serverTimeMs - receivedAtMs
        : serverTimeMs < requestedAtMs
            ? serverTimeMs - requestedAtMs
            : 0);
}
/** Converts client epoch milliseconds to the environment's clock. */
export function toServerClock(environmentId, clientMs) {
    return clientMs + (serverClockOffsets.get(environmentId) ?? 0);
}
const neverPassed = {
    subscribe: () => () => { },
    getSnapshot: () => false,
    refresh: () => { },
};
// The single owner of each subscribed deadline. Handles obtained before the
// entry exists join it on subscribe, so they share its timer and notifications.
const deadlines = new Map();
function passDeadline(entry) {
    clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.passed = true;
    for (const listener of entry.listeners)
        listener();
}
function armDeadline(entry, deadlineMs) {
    const delay = deadlineMs - Date.now();
    if (delay <= 0) {
        passDeadline(entry);
        return;
    }
    entry.timer = setTimeout(() => armDeadline(entry, deadlineMs), Math.min(delay, MAX_TIMEOUT_MS));
}
/** The epoch-ms deadline `delayMs` from now, for `deadlineStore`. */
export function deadlineAfter(delayMs) {
    return Date.now() + delayMs;
}
/**
 * Whether `Date.now()` has reached `deadlineMs`. One timer per distinct
 * deadline, shared by its subscribers; once passed the snapshot stays true.
 * Deadlines register only while subscribed, so renders React discards leak nothing.
 * A non-finite deadline never passes.
 */
export function deadlineStore(deadlineMs) {
    if (deadlineMs === null || !Number.isFinite(deadlineMs))
        return neverPassed;
    const existing = deadlines.get(deadlineMs);
    if (existing !== undefined)
        return existing.store;
    const store = {
        subscribe: (listener) => {
            let entry = deadlines.get(deadlineMs);
            if (entry === undefined) {
                entry = { store, listeners: new Set(), passed: Date.now() >= deadlineMs, timer: undefined };
                deadlines.set(deadlineMs, entry);
                if (!entry.passed)
                    armDeadline(entry, deadlineMs);
            }
            const joined = entry;
            joined.listeners.add(listener);
            return () => {
                joined.listeners.delete(listener);
                if (joined.listeners.size > 0)
                    return;
                clearTimeout(joined.timer);
                joined.timer = undefined;
                if (deadlines.get(deadlineMs) === joined)
                    deadlines.delete(deadlineMs);
            };
        },
        getSnapshot: () => deadlines.get(deadlineMs)?.passed ?? Date.now() >= deadlineMs,
        refresh: () => {
            const entry = deadlines.get(deadlineMs);
            if (entry !== undefined && !entry.passed && Date.now() >= deadlineMs)
                passDeadline(entry);
        },
    };
    return store;
}
//# sourceMappingURL=upstream-clock.js.map