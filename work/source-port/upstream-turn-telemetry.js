import { collectProviderUsageLimits, limitsNotice, paceOf, paceRemainingPercent, remainingPercent, } from "@t3tools/shared/usageLimits";
import * as DateTime from "effect/DateTime";
const MIN_TPS_DURATION_MS = 100;
const MAX_REASONABLE_TTFT_MS = 3_600_000;
function toEpochMs(value) {
    if (value == null)
        return null;
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    const ms = DateTime.toEpochMillis(value);
    return Number.isFinite(ms) ? ms : null;
}
function asPositiveNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
/** Merges overlapping [start, end] ranges so concurrent items do not double-count active time. */
export function sumMergedIntervalDurationMs(intervals) {
    const valid = intervals
        .filter((interval) => Number.isFinite(interval.start) &&
        Number.isFinite(interval.end) &&
        interval.end > interval.start)
        .toSorted((left, right) => left.start - right.start);
    if (valid.length === 0)
        return 0;
    let total = 0;
    let currentStart = valid[0].start;
    let currentEnd = valid[0].end;
    for (let index = 1; index < valid.length; index += 1) {
        const next = valid[index];
        if (next.start <= currentEnd) {
            if (next.end > currentEnd)
                currentEnd = next.end;
        }
        else {
            total += currentEnd - currentStart;
            currentStart = next.start;
            currentEnd = next.end;
        }
    }
    return total + (currentEnd - currentStart);
}
function isModelGenerationItem(type) {
    return type === "reasoning" || type === "assistant_message";
}
function isNonWorkItem(type) {
    return (type === "user_message" ||
        type === "notification" ||
        type === "system_notice" ||
        type === "handoff" ||
        type === "fork" ||
        type === "checkpoint" ||
        type === "compaction");
}
function resolveTurnBaselineMs(turn, attempt, run) {
    return (toEpochMs(turn.startedAt) ??
        toEpochMs(attempt?.startedAt) ??
        toEpochMs(run?.startedAt) ??
        toEpochMs(run?.requestedAt));
}
function resolveTurnUsage(turn) {
    const ttu = turn.turnTokenUsage;
    const tu = turn.tokenUsage;
    const inputTokens = asPositiveNumber(ttu?.inputTokens) ?? asPositiveNumber(tu?.inputTokens);
    const cachedInputTokens = asPositiveNumber(ttu?.cachedInputTokens) ?? asPositiveNumber(tu?.cachedInputTokens);
    const cacheCreationTokens = asPositiveNumber(ttu?.cacheCreationTokens);
    const outputTokens = asPositiveNumber(ttu?.outputTokens) ?? asPositiveNumber(tu?.outputTokens);
    const reasoningTokens = asPositiveNumber(ttu?.reasoningTokens) ?? asPositiveNumber(tu?.reasoningOutputTokens);
    const usageStatus = ttu?.usageStatus ?? (tu !== undefined ? "complete" : null);
    return {
        inputTokens,
        cachedInputTokens,
        cacheCreationTokens,
        outputTokens,
        reasoningTokens,
        usageStatus,
    };
}
function computeRate(tokens, durationMs) {
    if (tokens === null || tokens <= 0 || durationMs === null || durationMs < MIN_TPS_DURATION_MS) {
        return null;
    }
    return tokens / (durationMs / 1_000);
}
function buildSnapshot(input) {
    let firstModelOutputMs = null;
    let firstToolMs = null;
    let firstAnswerStartMs = null;
    const generationIntervals = [];
    const toolIntervals = [];
    for (const item of input.items) {
        if (isNonWorkItem(item.type))
            continue;
        const itemStart = toEpochMs(item.startedAt);
        const itemEnd = toEpochMs(item.completedAt);
        if (isModelGenerationItem(item.type)) {
            if (itemStart !== null && (firstModelOutputMs === null || itemStart < firstModelOutputMs)) {
                firstModelOutputMs = itemStart;
            }
            if (item.type === "assistant_message" &&
                itemStart !== null &&
                (firstAnswerStartMs === null || itemStart < firstAnswerStartMs)) {
                firstAnswerStartMs = itemStart;
            }
            if (itemStart !== null && itemEnd !== null && itemEnd > itemStart) {
                generationIntervals.push({ start: itemStart, end: itemEnd });
            }
        }
        else {
            if (itemStart !== null && (firstToolMs === null || itemStart < firstToolMs)) {
                firstToolMs = itemStart;
            }
            if (itemStart !== null && itemEnd !== null && itemEnd > itemStart) {
                toolIntervals.push({ start: itemStart, end: itemEnd });
            }
        }
    }
    const firstTokenMs = firstModelOutputMs ?? firstToolMs;
    const rawTtft = input.startMs !== null && firstTokenMs !== null
        ? Math.max(0, firstTokenMs - input.startMs)
        : null;
    const ttftMs = rawTtft !== null && rawTtft <= MAX_REASONABLE_TTFT_MS ? rawTtft : null;
    const rawFirstAnswer = input.startMs !== null && firstAnswerStartMs !== null
        ? Math.max(0, firstAnswerStartMs - input.startMs)
        : null;
    const firstAnswerMs = rawFirstAnswer !== null &&
        rawFirstAnswer <= MAX_REASONABLE_TTFT_MS &&
        (ttftMs === null || Math.abs(rawFirstAnswer - ttftMs) >= 250)
        ? rawFirstAnswer
        : null;
    const totalDurationMs = input.startMs !== null && input.endMs !== null && input.endMs > input.startMs
        ? input.endMs - input.startMs
        : null;
    const mergedGenMs = sumMergedIntervalDurationMs(generationIntervals);
    const generationDurationMs = mergedGenMs > 0 ? mergedGenMs : null;
    const mergedToolMs = sumMergedIntervalDurationMs(toolIntervals);
    const toolDurationMs = mergedToolMs > 0 ? mergedToolMs : null;
    const effectiveGenMs = generationDurationMs !== null && generationDurationMs >= MIN_TPS_DURATION_MS
        ? generationDurationMs
        : totalDurationMs;
    const generationTps = computeRate(input.outputTokens, effectiveGenMs);
    const endToEndTps = computeRate(input.outputTokens, totalDurationMs);
    const cacheHitPercent = input.inputTokens !== null && input.inputTokens > 0 && input.cachedInputTokens !== null
        ? Math.min(100, (input.cachedInputTokens / input.inputTokens) * 100)
        : null;
    return {
        providerTurnId: input.providerTurnId,
        runId: input.runId,
        status: input.status,
        ttftMs,
        firstAnswerMs,
        generationDurationMs,
        toolDurationMs,
        totalDurationMs,
        inputTokens: input.inputTokens,
        cachedInputTokens: input.cachedInputTokens,
        cacheCreationTokens: input.cacheCreationTokens,
        cacheHitPercent,
        outputTokens: input.outputTokens,
        reasoningTokens: input.reasoningTokens,
        generationTps,
        endToEndTps,
        usageStatus: input.usageStatus,
    };
}
export function deriveTurnTelemetryIndex(projection) {
    const byProviderTurnId = new Map();
    const byRunId = new Map();
    if (!projection || projection.providerTurns.length === 0) {
        return {
            byProviderTurnId,
            byRunId,
            latest: null,
            latestWithCache: null,
            sessionCacheHitPercent: null,
            sessionCacheTurnCount: 0,
        };
    }
    const runsById = new Map(projection.runs.map((run) => [run.id, run]));
    const attemptsById = new Map(projection.attempts.map((attempt) => [attempt.id, attempt]));
    const itemsByTurnId = new Map();
    const itemsByRunId = new Map();
    for (const item of projection.turnItems) {
        if (item.providerTurnId !== null) {
            const list = itemsByTurnId.get(item.providerTurnId);
            if (list)
                list.push(item);
            else
                itemsByTurnId.set(item.providerTurnId, [item]);
        }
        if (item.runId !== null) {
            const list = itemsByRunId.get(item.runId);
            if (list)
                list.push(item);
            else
                itemsByRunId.set(item.runId, [item]);
        }
    }
    const turnsByRunId = new Map();
    let latest = null;
    let latestSortMs = -1;
    let latestWithCache = null;
    let latestCacheSortMs = -1;
    let totalCacheInput = 0;
    let totalCacheRead = 0;
    let sessionCacheTurnCount = 0;
    for (const turn of projection.providerTurns) {
        const attempt = turn.runAttemptId !== null ? attemptsById.get(turn.runAttemptId) : undefined;
        const run = attempt !== undefined ? runsById.get(attempt.runId) : undefined;
        const runId = run?.id ?? attempt?.runId ?? null;
        const turnItems = itemsByTurnId.get(turn.id) ?? [];
        const startMs = resolveTurnBaselineMs(turn, attempt, run);
        const endMs = toEpochMs(turn.completedAt) ?? toEpochMs(attempt?.completedAt);
        const usage = resolveTurnUsage(turn);
        const snapshot = buildSnapshot({
            providerTurnId: turn.id,
            runId,
            status: turn.status,
            startMs,
            endMs,
            items: turnItems,
            ...usage,
        });
        byProviderTurnId.set(turn.id, snapshot);
        const sortMs = endMs ?? startMs ?? 0;
        if (sortMs >= latestSortMs) {
            latestSortMs = sortMs;
            latest = snapshot;
        }
        if (snapshot.cacheHitPercent !== null &&
            snapshot.inputTokens !== null &&
            snapshot.inputTokens > 0) {
            totalCacheInput += snapshot.inputTokens;
            totalCacheRead += snapshot.cachedInputTokens ?? 0;
            sessionCacheTurnCount += 1;
            if (sortMs >= latestCacheSortMs) {
                latestCacheSortMs = sortMs;
                latestWithCache = snapshot;
            }
        }
        if (runId !== null) {
            const list = turnsByRunId.get(runId);
            if (list)
                list.push(turn);
            else
                turnsByRunId.set(runId, [turn]);
        }
    }
    for (const [runId, turns] of turnsByRunId) {
        if (turns.length === 1) {
            const single = byProviderTurnId.get(turns[0].id);
            if (single)
                byRunId.set(runId, single);
            continue;
        }
        const ordered = turns.toSorted((left, right) => left.ordinal - right.ordinal);
        const firstTurn = ordered[0];
        const lastTurn = ordered[ordered.length - 1];
        const run = runsById.get(runId);
        const firstAttempt = firstTurn.runAttemptId !== null ? attemptsById.get(firstTurn.runAttemptId) : undefined;
        const startMs = resolveTurnBaselineMs(firstTurn, firstAttempt, run);
        const endMs = toEpochMs(lastTurn.completedAt) ?? toEpochMs(run?.completedAt);
        let inputTokens = null;
        let cachedInputTokens = null;
        let cacheCreationTokens = null;
        let outputTokens = null;
        let reasoningTokens = null;
        let usageStatus = null;
        for (const turn of ordered) {
            const usage = resolveTurnUsage(turn);
            if (usage.inputTokens !== null)
                inputTokens = (inputTokens ?? 0) + usage.inputTokens;
            if (usage.cachedInputTokens !== null) {
                cachedInputTokens = (cachedInputTokens ?? 0) + usage.cachedInputTokens;
            }
            if (usage.cacheCreationTokens !== null) {
                cacheCreationTokens = (cacheCreationTokens ?? 0) + usage.cacheCreationTokens;
            }
            if (usage.outputTokens !== null)
                outputTokens = (outputTokens ?? 0) + usage.outputTokens;
            if (usage.reasoningTokens !== null) {
                reasoningTokens = (reasoningTokens ?? 0) + usage.reasoningTokens;
            }
            if (usage.usageStatus === "complete") {
                usageStatus ??= "complete";
            }
            else if (usage.usageStatus === "partial") {
                usageStatus = "partial";
            }
            else if (usage.usageStatus === "unavailable" && usageStatus === null) {
                usageStatus = "unavailable";
            }
        }
        byRunId.set(runId, buildSnapshot({
            providerTurnId: lastTurn.id,
            runId,
            status: lastTurn.status,
            startMs,
            endMs,
            items: itemsByRunId.get(runId) ?? [],
            inputTokens,
            cachedInputTokens,
            cacheCreationTokens,
            outputTokens,
            reasoningTokens,
            usageStatus,
        }));
    }
    const sessionCacheHitPercent = totalCacheInput > 0 ? Math.min(100, (totalCacheRead / totalCacheInput) * 100) : null;
    return {
        byProviderTurnId,
        byRunId,
        latest,
        latestWithCache,
        sessionCacheHitPercent,
        sessionCacheTurnCount,
    };
}
export function lookupTurnTelemetry(index, target) {
    if (!index)
        return null;
    if (target.runId != null) {
        const byRun = index.byRunId.get(target.runId);
        if (byRun)
            return byRun;
    }
    if (target.providerTurnId != null) {
        return index.byProviderTurnId.get(target.providerTurnId) ?? null;
    }
    return null;
}
export function hasVisibleTurnTelemetry(snapshot) {
    return snapshot !== null && (snapshot.ttftMs !== null || snapshot.generationTps !== null);
}
export function formatLatencyMs(ms) {
    if (!Number.isFinite(ms) || ms < 0)
        return "0ms";
    if (ms < 1_000)
        return `${Math.round(ms)}ms`;
    const seconds = ms / 1_000;
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }
    const wholeMinutes = Math.floor(seconds / 60);
    const remainderSeconds = Math.round(seconds % 60);
    return remainderSeconds === 60
        ? `${wholeMinutes + 1}m`
        : remainderSeconds === 0
            ? `${wholeMinutes}m`
            : `${wholeMinutes}m ${remainderSeconds}s`;
}
export function formatTps(tps) {
    if (!Number.isFinite(tps) || tps <= 0)
        return "0 t/s";
    return tps >= 100 ? `${Math.round(tps)} t/s` : `${tps.toFixed(1)} t/s`;
}
export function formatCompactTokenCount(value) {
    if (!Number.isFinite(value) || value <= 0)
        return "0";
    if (value < 1_000)
        return `${Math.round(value)}`;
    if (value < 10_000)
        return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    if (value < 999_500)
        return `${Math.round(value / 1_000)}k`;
    return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m`;
}
const ROUTE_PREFIX_TO_DRIVER = {
    antigravity: "antigravity",
    codex: "codex",
    openai: "codex",
    claude: "claudeAgent",
    anthropic: "claudeAgent",
    cursor: "cursor",
    grok: "grok",
    xai: "grok",
    opencode: "opencode",
    "opencode-go": "opencode",
};
const NON_CLAUDE_MODEL_PREFIXES = [
    "glm-",
    "glm4",
    "glm5",
    "deepseek",
    "qwen",
    "kimi",
    "moonshot",
    "minimax",
    "doubao",
    "gpt-",
    "o1",
    "o3",
    "o4",
    "gemini-",
    "grok-",
    "llama",
    "mistral",
];
function stripContextSuffix(model) {
    return model.trim().replace(/\[[^\]]+\]$/, "");
}
export function parseModelQuotaTarget(model) {
    if (!model?.trim())
        return null;
    const raw = model.trim();
    const normalized = stripContextSuffix(raw);
    const slashIndex = normalized.indexOf("/");
    if (slashIndex > 0) {
        const routePrefix = normalized.slice(0, slashIndex).trim().toLowerCase();
        const bareModel = normalized.slice(slashIndex + 1).trim();
        const targetDriver = ROUTE_PREFIX_TO_DRIVER[routePrefix] ?? null;
        return {
            raw,
            normalized,
            routePrefix,
            bareModel: bareModel || normalized,
            targetDriver,
            externalVendor: targetDriver === null ? routePrefix : null,
        };
    }
    return {
        raw,
        normalized,
        routePrefix: null,
        bareModel: normalized,
        targetDriver: null,
        externalVendor: null,
    };
}
function isNonClaudeModelOnClaudeDriver(driver, parsed) {
    if (driver !== "claudeAgent" || parsed === null)
        return false;
    if (parsed.externalVendor !== null)
        return true;
    if (parsed.targetDriver !== null && parsed.targetDriver !== "claudeAgent")
        return true;
    const lower = parsed.bareModel.toLowerCase();
    return NON_CLAUDE_MODEL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}
function isCustomApiInstance(provider) {
    if (!provider)
        return false;
    if (provider.usageLimits?.unavailable?.reason === "unsupported")
        return true;
    const authLabel = provider.auth.label?.toLowerCase() ?? "";
    return authLabel.includes("custom api") || authLabel.includes("api key");
}
const WINDOW_KIND_PRIORITY = {
    session: 0,
    weekly: 1,
    monthly: 2,
    other: 3,
};
const DRIVER_NATIVE_PROVIDER_IDS = {
    claudeAgent: ["claude", "anthropic"],
    codex: ["codex", "openai"],
    antigravity: ["antigravity"],
    cursor: ["cursor"],
    grok: ["grok", "xai"],
    opencode: ["opencode", "opencode-go"],
};
function matchesActiveModel(window, driver, model) {
    if (!model)
        return true;
    const parsed = parseModelQuotaTarget(model);
    const bare = parsed?.bareModel ?? model;
    const bareLower = bare.toLowerCase();
    const normalizedLower = (parsed?.normalized ?? model).toLowerCase();
    if (window.modelIds !== undefined &&
        !window.modelIds.some((id) => id === model ||
            id.toLowerCase() === normalizedLower ||
            stripContextSuffix(id).toLowerCase() === bareLower)) {
        return false;
    }
    if (window.providerIds !== undefined) {
        const prefix = parsed?.routePrefix ?? "";
        if (prefix) {
            if (!window.providerIds.some((id) => id.toLowerCase() === prefix)) {
                return false;
            }
        }
        else if (driver !== null) {
            const nativeIds = DRIVER_NATIVE_PROVIDER_IDS[String(driver)] ?? [
                String(driver).toLowerCase(),
            ];
            if (!window.providerIds.some((id) => nativeIds.includes(id.toLowerCase()))) {
                return false;
            }
        }
    }
    if (driver === "antigravity") {
        const idLower = window.id.toLowerCase();
        if (bareLower.includes("argon") && idLower.startsWith("gemini-carbon-"))
            return false;
        if (bareLower.includes("carbon") && idLower.startsWith("gemini-argon-"))
            return false;
        const family = bareLower.match(/^(gemini|claude|gpt)-/)?.[1];
        const pool = idLower.match(/^(gemini|claude|gpt|3p)-/)?.[1];
        if (family !== undefined && pool !== undefined) {
            return pool === family || (pool === "3p" && (family === "claude" || family === "gpt"));
        }
    }
    return true;
}
function modelSpecificPoolBonus(window, driver, activeModel) {
    if (driver !== "antigravity" || !activeModel)
        return 0;
    const bareLower = (parseModelQuotaTarget(activeModel)?.bareModel ?? activeModel).toLowerCase();
    const idLower = window.id.toLowerCase();
    if (bareLower.includes("argon") && idLower.startsWith("gemini-argon-"))
        return -1;
    if (bareLower.includes("carbon") && idLower.startsWith("gemini-carbon-"))
        return -1;
    return 0;
}
export function selectPrimaryUsageWindows(input) {
    const all = input.limits?.windows ?? [];
    if (all.length === 0)
        return { inline: [], sibling: [], all: [], overflowCount: 0 };
    const maxInline = input.maxInline ?? 2;
    const matching = all.filter((window) => matchesActiveModel(window, input.driver, input.activeModel));
    const pool = matching.length > 0 ? matching : all;
    const ranked = pool.toSorted((left, right) => {
        const kindDiff = WINDOW_KIND_PRIORITY[left.kind] - WINDOW_KIND_PRIORITY[right.kind];
        if (kindDiff !== 0)
            return kindDiff;
        const bonusDiff = modelSpecificPoolBonus(left, input.driver, input.activeModel) -
            modelSpecificPoolBonus(right, input.driver, input.activeModel);
        if (bonusDiff !== 0)
            return bonusDiff;
        return remainingPercent(left) - remainingPercent(right);
    });
    // Pick at most one primary window per cadence (e.g. one session + one weekly) before doubling up,
    // so 5h & 7d stay paired on the bar while secondary weekly pools sit cleanly under Other model pools.
    const inline = [];
    const seenKinds = new Set();
    for (const window of ranked) {
        if (inline.length >= maxInline)
            break;
        if (!seenKinds.has(window.kind)) {
            inline.push(window);
            seenKinds.add(window.kind);
        }
    }
    for (const window of ranked) {
        if (inline.length >= maxInline)
            break;
        if (!inline.some((entry) => entry.id === window.id)) {
            inline.push(window);
        }
    }
    const inlineIds = new Set(inline.map((window) => window.id));
    const sibling = all.filter((window) => !inlineIds.has(window.id));
    return {
        inline,
        sibling,
        all,
        overflowCount: sibling.length,
    };
}
function accountProviderIds(account) {
    const ids = new Set();
    for (const window of account.usageLimits.windows) {
        for (const id of window.providerIds ?? []) {
            const normalized = id.trim().toLowerCase();
            if (normalized)
                ids.add(normalized);
        }
    }
    return ids;
}
function formatSourceAccountPlan(plan, totalMatches) {
    const trimmed = plan?.trim() || null;
    if (totalMatches > 1) {
        return trimmed ? `${trimmed} · ${totalMatches} accts` : `${totalMatches} accts`;
    }
    return trimmed;
}
function scoreSourceAccount(account, activeModel) {
    const windows = account.usageLimits.windows;
    const matching = windows.filter((window) => matchesActiveModel(window, account.driver, activeModel));
    const pool = matching.length > 0 ? matching : windows;
    const hasSpecificBonus = pool.some((window) => modelSpecificPoolBonus(window, account.driver, activeModel) < 0);
    const maxUsed = pool.reduce((max, window) => Math.max(max, window.usedPercent), 0);
    const minRemaining = pool.reduce((min, window) => Math.min(min, remainingPercent(window)), 100);
    const isActivelySpending = maxUsed > 0 && minRemaining > 0;
    let score = 0;
    if (hasSpecificBonus)
        score += 1_000;
    if (isActivelySpending)
        score += 500 + maxUsed;
    else if (minRemaining > 0)
        score += 200;
    else
        score += minRemaining;
    return score;
}
function resolveUsableSourceAccount(input) {
    const vendor = input.vendorPrefix?.trim().toLowerCase() || null;
    const driver = input.driver ?? null;
    const nativeDriverIds = driver !== null
        ? new Set(DRIVER_NATIVE_PROVIDER_IDS[String(driver)] ?? [String(driver).toLowerCase()])
        : null;
    const candidates = [];
    for (const source of input.sources) {
        for (const account of source.accounts) {
            if (limitsNotice(account.usageLimits) !== null || account.usageLimits.windows.length === 0) {
                continue;
            }
            const providerIds = accountProviderIds(account);
            let matched = false;
            if (vendor !== null) {
                matched = providerIds.has(vendor) || account.id.toLowerCase().startsWith(`${vendor}:`);
            }
            else if (driver !== null && account.driver === driver) {
                if (providerIds.size === 0) {
                    matched = true;
                }
                else if (nativeDriverIds !== null) {
                    matched = [...providerIds].some((id) => nativeDriverIds.has(id));
                }
            }
            if (!matched)
                continue;
            candidates.push({
                source,
                account,
                score: scoreSourceAccount(account, input.activeModel),
            });
        }
    }
    if (candidates.length === 0)
        return null;
    candidates.sort((left, right) => right.score - left.score);
    const winner = candidates[0];
    const label = winner.account.displayName?.trim() || winner.source.label || String(winner.account.driver);
    return {
        source: winner.source,
        account: winner.account,
        label,
        plan: formatSourceAccountPlan(winner.account.plan, candidates.length),
        sourceLabel: winner.source.kind === "magpie" ? "Magpie" : winner.source.label,
    };
}
function collectOtherActiveSubscriptions(providers, sources, now, excludeInstanceId) {
    const seenPools = new Set();
    const summaries = [];
    for (const provider of providers) {
        if (!provider.enabled || !provider.installed)
            continue;
        if (excludeInstanceId !== null && provider.instanceId === excludeInstanceId)
            continue;
        const report = collectProviderUsageLimits(provider.instanceId, providers, sources, now);
        const account = report?.accounts.find((entry) => entry.instanceId === provider.instanceId);
        const limits = account?.limits ?? provider.usageLimits;
        if (!limits || limitsNotice(limits) !== null || limits.windows.length === 0)
            continue;
        const poolKey = `driver:${provider.driver}`;
        if (seenPools.has(poolKey))
            continue;
        seenPools.add(poolKey);
        const picked = selectPrimaryUsageWindows({ limits, driver: provider.driver, maxInline: 2 });
        summaries.push({
            instanceId: String(provider.instanceId),
            driver: provider.driver,
            label: account?.displayName ?? provider.displayName ?? String(provider.driver),
            plan: account?.plan ?? provider.auth.label ?? null,
            windows: picked.inline,
        });
    }
    // Also include active hub/Magpie subscriptions (e.g. ZCode, Codex, Antigravity) grouped by vendor pool.
    const groupedSources = new Map();
    for (const source of sources) {
        for (const account of source.accounts) {
            if (limitsNotice(account.usageLimits) !== null || account.usageLimits.windows.length === 0) {
                continue;
            }
            const providerIds = [...accountProviderIds(account)];
            const vendorKey = providerIds[0] ?? String(account.driver);
            const nativeKey = `driver:${account.driver}`;
            if (providerIds.length === 0 && seenPools.has(nativeKey)) {
                continue;
            }
            if (providerIds.length > 0 &&
                (DRIVER_NATIVE_PROVIDER_IDS[String(account.driver)] ?? []).includes(vendorKey) &&
                seenPools.has(nativeKey)) {
                continue;
            }
            const list = groupedSources.get(vendorKey);
            if (list)
                list.push({ source, account });
            else
                groupedSources.set(vendorKey, [{ source, account }]);
        }
    }
    for (const [vendorKey, entries] of groupedSources) {
        if (seenPools.has(`vendor:${vendorKey}`))
            continue;
        seenPools.add(`vendor:${vendorKey}`);
        const ranked = entries.toSorted((left, right) => scoreSourceAccount(right.account, null) - scoreSourceAccount(left.account, null));
        const winner = ranked[0];
        const picked = selectPrimaryUsageWindows({
            limits: winner.account.usageLimits,
            driver: winner.account.driver,
            maxInline: 2,
        });
        if (picked.inline.length === 0)
            continue;
        summaries.push({
            instanceId: `${winner.source.id}:${winner.account.id}`,
            driver: winner.account.driver,
            label: winner.account.displayName?.trim() || vendorKey,
            plan: formatSourceAccountPlan(winner.account.plan, entries.length),
            windows: picked.inline,
        });
    }
    return summaries;
}
function resolveUsableProviderForDriver(input) {
    for (const provider of input.providers) {
        if (provider.driver !== input.driver || !provider.enabled || !provider.installed)
            continue;
        const report = collectProviderUsageLimits(provider.instanceId, input.providers, input.sources, input.now);
        const account = report?.accounts.find((entry) => entry.instanceId === provider.instanceId);
        const limits = account?.limits ?? provider.usageLimits;
        if (!limits || limitsNotice(limits) !== null || limits.windows.length === 0)
            continue;
        return {
            provider,
            limits,
            plan: account?.plan ?? provider.auth.label ?? null,
            label: account?.displayName ?? provider.displayName ?? String(provider.driver),
        };
    }
    return null;
}
/**
 * Resolves quota at model granularity first so custom-routed models (e.g. zcode/GLM-5.3 or
 * antigravity/gemini-4-argon through Magpie) match their exact subscription pool and never
 * misreport Claude Sub limits.
 */
export function resolveModelQuotaState(input) {
    const selected = input.providerInstanceId !== null
        ? input.providers.find((provider) => provider.instanceId === input.providerInstanceId)
        : undefined;
    const parsed = parseModelQuotaTarget(input.activeModel);
    // 1. Third-party vendor prefix (e.g. zcode/GLM-5.3, workbuddy-ai/...) matched directly in Magpie/hub sources.
    if (parsed?.externalVendor) {
        const vendorSource = resolveUsableSourceAccount({
            sources: input.sources,
            vendorPrefix: parsed.externalVendor,
            activeModel: parsed.normalized,
        });
        if (vendorSource) {
            const picked = selectPrimaryUsageWindows({
                limits: vendorSource.account.usageLimits,
                driver: vendorSource.account.driver,
                activeModel: parsed.normalized,
                maxInline: 2,
            });
            return {
                kind: "subscription",
                label: vendorSource.label,
                plan: vendorSource.plan,
                modelLabel: parsed.bareModel,
                driver: vendorSource.account.driver,
                matchedInstanceId: null,
                isRoutedMatch: true,
                sourceLabel: vendorSource.sourceLabel,
                limits: vendorSource.account.usageLimits,
                primaryWindows: picked.inline,
                siblingWindows: picked.sibling,
                unavailableNotice: null,
            };
        }
    }
    // 2. Model explicitly names another provider prefix (e.g. antigravity/gemini-4-argon or codex/gpt-6-astra).
    if (parsed?.targetDriver && selected && parsed.targetDriver !== selected.driver) {
        const routed = resolveUsableProviderForDriver({
            driver: parsed.targetDriver,
            providers: input.providers,
            sources: input.sources,
            now: input.now,
        });
        if (routed) {
            const picked = selectPrimaryUsageWindows({
                limits: routed.limits,
                driver: routed.provider.driver,
                activeModel: parsed.bareModel,
                maxInline: 2,
            });
            return {
                kind: "subscription",
                label: routed.label,
                plan: routed.plan,
                modelLabel: parsed.bareModel,
                driver: routed.provider.driver,
                matchedInstanceId: routed.provider.instanceId,
                isRoutedMatch: true,
                limits: routed.limits,
                primaryWindows: picked.inline,
                siblingWindows: picked.sibling,
                unavailableNotice: null,
            };
        }
        const routedSource = resolveUsableSourceAccount({
            sources: input.sources,
            vendorPrefix: parsed.routePrefix,
            driver: parsed.targetDriver,
            activeModel: parsed.bareModel,
        });
        if (routedSource) {
            const picked = selectPrimaryUsageWindows({
                limits: routedSource.account.usageLimits,
                driver: routedSource.account.driver,
                activeModel: parsed.bareModel,
                maxInline: 2,
            });
            return {
                kind: "subscription",
                label: routedSource.label,
                plan: routedSource.plan,
                modelLabel: parsed.bareModel,
                driver: routedSource.account.driver,
                matchedInstanceId: null,
                isRoutedMatch: true,
                sourceLabel: routedSource.sourceLabel,
                limits: routedSource.account.usageLimits,
                primaryWindows: picked.inline,
                siblingWindows: picked.sibling,
                unavailableNotice: null,
            };
        }
    }
    // 3. Bare non-Claude model on Claude driver (e.g. GLM-5.3 without prefix): try Magpie vendor pool before unmetered fallback.
    const customEndpoint = isCustomApiInstance(selected);
    const foreignModel = isNonClaudeModelOnClaudeDriver(selected?.driver ?? null, parsed);
    if (selected && foreignModel && parsed && !parsed.externalVendor) {
        const lowerBare = parsed.bareModel.toLowerCase();
        const inferredVendor = lowerBare.startsWith("glm") ? "zcode" : null;
        if (inferredVendor) {
            const inferredSource = resolveUsableSourceAccount({
                sources: input.sources,
                vendorPrefix: inferredVendor,
                activeModel: `${inferredVendor}/${parsed.bareModel}`,
            });
            if (inferredSource) {
                const picked = selectPrimaryUsageWindows({
                    limits: inferredSource.account.usageLimits,
                    driver: inferredSource.account.driver,
                    activeModel: `${inferredVendor}/${parsed.bareModel}`,
                    maxInline: 2,
                });
                return {
                    kind: "subscription",
                    label: inferredSource.label,
                    plan: inferredSource.plan,
                    modelLabel: parsed.bareModel,
                    driver: inferredSource.account.driver,
                    matchedInstanceId: null,
                    isRoutedMatch: true,
                    sourceLabel: inferredSource.sourceLabel,
                    limits: inferredSource.account.usageLimits,
                    primaryWindows: picked.inline,
                    siblingWindows: picked.sibling,
                    unavailableNotice: null,
                };
            }
        }
    }
    // 4. Non-Claude or third-party vendor model with no matching quota source anywhere.
    if (selected && (foreignModel || (customEndpoint && parsed?.externalVendor !== null))) {
        const vendorLabel = parsed?.externalVendor ?? parsed?.routePrefix ?? "API";
        const hostLabel = selected.displayName?.trim() || String(selected.instanceId);
        return {
            kind: "unmetered-model",
            vendorLabel,
            modelLabel: parsed?.bareModel ?? null,
            hostLabel,
            reason: `Routed via ${vendorLabel} (${hostLabel}); no model-level subscription quota reported.`,
            otherSubscriptions: collectOtherActiveSubscriptions(input.providers, input.sources, input.now, selected.instanceId),
        };
    }
    if (!selected)
        return { kind: "none" };
    // 5. Native subscription provider (if directly authenticated and usable).
    if (!customEndpoint) {
        const report = collectProviderUsageLimits(selected.instanceId, input.providers, input.sources, input.now);
        const reportAccount = report?.accounts.find((entry) => entry.instanceId === selected.instanceId);
        const limits = reportAccount?.limits ?? selected.usageLimits ?? null;
        if (limits && limitsNotice(limits) === null && limits.windows.length > 0) {
            const picked = selectPrimaryUsageWindows({
                limits,
                driver: selected.driver,
                activeModel: parsed?.bareModel ?? input.activeModel,
                maxInline: 2,
            });
            return {
                kind: "subscription",
                label: reportAccount?.displayName ?? selected.displayName ?? String(selected.driver),
                plan: reportAccount?.plan ?? selected.auth.label ?? null,
                modelLabel: parsed?.bareModel ?? null,
                driver: selected.driver,
                matchedInstanceId: selected.instanceId,
                isRoutedMatch: false,
                limits,
                primaryWindows: picked.inline,
                siblingWindows: picked.sibling,
                unavailableNotice: null,
            };
        }
    }
    // 6. Hub / Magpie fallback matching this driver's own native quota pool (never bleeding zcode into Claude).
    const driverSource = resolveUsableSourceAccount({
        sources: input.sources,
        driver: selected.driver,
        activeModel: parsed?.bareModel ?? input.activeModel,
    });
    if (driverSource) {
        const picked = selectPrimaryUsageWindows({
            limits: driverSource.account.usageLimits,
            driver: driverSource.account.driver,
            activeModel: parsed?.bareModel ?? input.activeModel,
            maxInline: 2,
        });
        return {
            kind: "subscription",
            label: driverSource.label,
            plan: driverSource.plan,
            modelLabel: parsed?.bareModel ?? null,
            driver: driverSource.account.driver,
            matchedInstanceId: null,
            isRoutedMatch: true,
            sourceLabel: driverSource.sourceLabel,
            limits: driverSource.account.usageLimits,
            primaryWindows: picked.inline,
            siblingWindows: picked.sibling,
            unavailableNotice: null,
        };
    }
    // 7. Custom API endpoint with no subscription quota for this model; still surface other active hub/local subscriptions.
    if (customEndpoint) {
        const hostLabel = selected.displayName?.trim() || String(selected.instanceId);
        return {
            kind: "unmetered-model",
            vendorLabel: parsed?.routePrefix ?? "API",
            modelLabel: parsed?.bareModel ?? null,
            hostLabel,
            reason: `${hostLabel} uses a custom API endpoint without subscription limits for this model.`,
            otherSubscriptions: collectOtherActiveSubscriptions(input.providers, input.sources, input.now, selected.instanceId),
        };
    }
    // 8. Native provider with an unavailable/offline notice.
    const fallbackLimits = selected.usageLimits ?? null;
    if (!fallbackLimits)
        return { kind: "none" };
    const notice = limitsNotice(fallbackLimits);
    if (!notice)
        return { kind: "none" };
    return {
        kind: "subscription",
        label: selected.displayName ?? String(selected.driver),
        plan: selected.auth.label ?? null,
        modelLabel: parsed?.bareModel ?? null,
        driver: selected.driver,
        matchedInstanceId: selected.instanceId,
        isRoutedMatch: false,
        limits: fallbackLimits,
        primaryWindows: [],
        siblingWindows: [],
        unavailableNotice: notice,
    };
}
export function deriveQuotaWindowMetrics(window, now) {
    const remaining = remainingPercent(window);
    const used = Math.max(0, Math.min(100, 100 - remaining));
    const timeRemaining = paceRemainingPercent(window, now);
    const pace = paceOf(window, now);
    const headroomDelta = timeRemaining !== null ? Math.round(remaining - timeRemaining) : null;
    const parsedReset = window.resetsAt ? Date.parse(window.resetsAt) : Number.NaN;
    const resetsAtMs = Number.isFinite(parsedReset) ? parsedReset : null;
    const resetsInMs = resetsAtMs !== null && resetsAtMs > now ? resetsAtMs - now : null;
    let projectedRunwayMs = null;
    if (used >= 5 &&
        remaining > 0 &&
        timeRemaining !== null &&
        timeRemaining < 98 &&
        resetsInMs !== null &&
        typeof window.windowDurationMins === "number" &&
        window.windowDurationMins > 0) {
        const windowMs = window.windowDurationMins * 60_000;
        const elapsedMs = windowMs * ((100 - timeRemaining) / 100);
        if (elapsedMs > 0) {
            const runwayMs = (remaining / used) * elapsedMs;
            if (Number.isFinite(runwayMs) && runwayMs > 0 && runwayMs < resetsInMs * 0.95) {
                projectedRunwayMs = runwayMs;
            }
        }
    }
    return {
        remaining,
        used,
        timeRemaining,
        pace,
        headroomDelta,
        resetsAtMs,
        resetsInMs,
        projectedRunwayMs,
    };
}
function toneForContextCategory(id, name, index) {
    const key = (id ?? name).toLowerCase();
    if (key.includes("message"))
        return "sky";
    if (key.includes("mcp"))
        return "amber";
    if (key.includes("system_prompt") || key.includes("system prompt"))
        return "emerald";
    if (key.includes("system_tool") || key.includes("system tool"))
        return "violet";
    if (key.includes("skill") ||
        key.includes("memory") ||
        key.includes("agent") ||
        key.includes("custom")) {
        return "slate";
    }
    const palette = ["sky", "amber", "emerald", "violet", "slate"];
    return palette[index % palette.length] ?? "slate";
}
export function deriveContextWindowBreakdown(input) {
    const usedTokens = Math.max(0, Math.round(input.usage.usedTokens));
    const maxTokens = input.usage.maxTokens != null && input.usage.maxTokens > 0
        ? Math.round(input.usage.maxTokens)
        : null;
    const usedPercent = maxTokens !== null && input.usage.usedPercentage !== null
        ? Math.max(0, Math.min(100, input.usage.usedPercentage))
        : maxTokens !== null
            ? Math.min(100, (usedTokens / maxTokens) * 100)
            : null;
    const remainingTokens = maxTokens !== null ? Math.max(0, maxTokens - usedTokens) : null;
    const percentOfMax = (tokens) => (maxTokens !== null ? (tokens / maxTokens) * 100 : null);
    const autoCompactThreshold = input.usage.autoCompactThreshold != null && input.usage.autoCompactThreshold > 0
        ? Math.round(input.usage.autoCompactThreshold)
        : null;
    const snapInput = input.usage.lastInputTokens ?? input.usage.inputTokens ?? null;
    const snapCached = input.usage.lastCachedInputTokens ?? input.usage.cachedInputTokens ?? null;
    const turn = input.latestTurn;
    const lastCacheHitPercent = turn?.cacheHitPercent ??
        (snapInput !== null && snapInput > 0 && snapCached !== null
            ? Math.min(100, (snapCached / snapInput) * 100)
            : null);
    const sessionCacheHitPercent = input.sessionCacheHitPercent ?? null;
    const sessionCacheTurnCount = input.sessionCacheTurnCount ?? 0;
    const nativeBreakdown = input.usage.contextBreakdown ?? null;
    if (nativeBreakdown !== null && nativeBreakdown.categories.length > 0) {
        const segments = [];
        const deferredRows = [];
        let bufferTokens = null;
        let freeTokens = null;
        for (const [index, category] of nativeBreakdown.categories.entries()) {
            if (category.kind === "used") {
                if (category.tokens <= 0)
                    continue;
                segments.push({
                    id: category.id ?? `cat-${index}`,
                    label: category.name,
                    tokens: category.tokens,
                    percentOfMax: percentOfMax(category.tokens),
                    tone: toneForContextCategory(category.id, category.name, index),
                });
            }
            else if (category.kind === "buffer") {
                if (category.tokens > 0)
                    bufferTokens = (bufferTokens ?? 0) + category.tokens;
            }
            else if (category.kind === "free") {
                freeTokens = (freeTokens ?? 0) + category.tokens;
            }
            else if (category.kind === "deferred") {
                if (category.tokens <= 0)
                    continue;
                deferredRows.push({
                    id: category.id ?? `deferred-${index}`,
                    label: category.name,
                    tokens: category.tokens,
                });
            }
        }
        const fallbackBuffer = maxTokens !== null && autoCompactThreshold !== null && autoCompactThreshold < maxTokens
            ? Math.max(0, maxTokens - autoCompactThreshold)
            : null;
        const autoCompactBufferTokens = bufferTokens ?? fallbackBuffer;
        const autoCompactBufferPercent = autoCompactBufferTokens !== null ? percentOfMax(autoCompactBufferTokens) : null;
        const freeSpaceTokens = freeTokens ??
            (remainingTokens !== null
                ? Math.max(0, remainingTokens - (autoCompactBufferTokens ?? 0))
                : null);
        const freeSpacePercent = freeSpaceTokens !== null ? percentOfMax(freeSpaceTokens) : null;
        return {
            mode: "categories",
            usedTokens,
            maxTokens,
            usedPercent,
            remainingTokens,
            autoCompactThreshold,
            autoCompactBufferTokens,
            autoCompactBufferPercent,
            freeSpaceTokens,
            freeSpacePercent,
            segments,
            deferredRows,
            turnCount: input.turnCount,
            toolCallCount: input.toolCallCount,
            skillCount: nativeBreakdown.skillCount ?? input.skillCount,
            mcpToolCount: nativeBreakdown.mcpToolCount ?? null,
            memoryFileCount: nativeBreakdown.memoryFileCount ?? null,
            customAgentCount: nativeBreakdown.customAgentCount ?? null,
            lastCacheHitPercent,
            sessionCacheHitPercent,
            sessionCacheTurnCount,
        };
    }
    const autoCompactBufferTokens = maxTokens !== null && autoCompactThreshold !== null && autoCompactThreshold < maxTokens
        ? Math.max(0, maxTokens - autoCompactThreshold)
        : null;
    const autoCompactBufferPercent = autoCompactBufferTokens !== null ? percentOfMax(autoCompactBufferTokens) : null;
    const freeSpaceTokens = remainingTokens !== null ? Math.max(0, remainingTokens - (autoCompactBufferTokens ?? 0)) : null;
    const freeSpacePercent = freeSpaceTokens !== null ? percentOfMax(freeSpaceTokens) : null;
    const segments = [];
    let mode = "total-only";
    if (usedTokens > 0 && lastCacheHitPercent !== null) {
        mode = "cache-split";
        const cachedTokens = Math.min(usedTokens, Math.round((usedTokens * lastCacheHitPercent) / 100));
        const uncachedTokens = Math.max(0, usedTokens - cachedTokens);
        if (cachedTokens > 0) {
            segments.push({
                id: "cached",
                label: "Cached context",
                tokens: cachedTokens,
                percentOfMax: percentOfMax(cachedTokens),
                tone: "sky",
            });
        }
        if (uncachedTokens > 0) {
            segments.push({
                id: "uncached",
                label: "Uncached context",
                tokens: uncachedTokens,
                percentOfMax: percentOfMax(uncachedTokens),
                tone: "amber",
            });
        }
    }
    else if (usedTokens > 0) {
        segments.push({
            id: "active",
            label: "Used context",
            tokens: usedTokens,
            percentOfMax: percentOfMax(usedTokens),
            tone: "sky",
        });
    }
    return {
        mode,
        usedTokens,
        maxTokens,
        usedPercent,
        remainingTokens,
        autoCompactThreshold,
        autoCompactBufferTokens,
        autoCompactBufferPercent,
        freeSpaceTokens,
        freeSpacePercent,
        segments,
        deferredRows: [],
        turnCount: input.turnCount,
        toolCallCount: input.toolCallCount,
        skillCount: input.skillCount,
        mcpToolCount: null,
        memoryFileCount: null,
        customAgentCount: null,
        lastCacheHitPercent,
        sessionCacheHitPercent,
        sessionCacheTurnCount,
    };
}
export function countThreadToolCalls(projection) {
    if (!projection)
        return 0;
    let count = 0;
    for (const item of projection.turnItems) {
        if (!isNonWorkItem(item.type) && !isModelGenerationItem(item.type)) {
            count += 1;
        }
    }
    return count;
}
export function formatShortWindowLabel(window) {
    const duration = window.windowDurationMins;
    if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
        if (duration < 60)
            return `${Math.round(duration)}m`;
        if (duration < 1_440 && duration % 60 === 0)
            return `${duration / 60}h`;
        if (duration === 10_080)
            return "7d";
        if (duration >= 1_440 && duration % 1_440 === 0)
            return `${duration / 1_440}d`;
    }
    const lower = window.label.toLowerCase();
    const hourMatch = lower.match(/\b(\d+)\s*(?:h|hr|hour|hours)\b/);
    if (hourMatch?.[1])
        return `${hourMatch[1]}h`;
    if (lower.includes("week") || window.kind === "weekly")
        return "7d";
    if (lower.includes("month") || window.kind === "monthly")
        return "30d";
    if (lower.includes("day") || lower.includes("daily"))
        return "1d";
    if (window.kind === "session")
        return "5h";
    return window.label.length <= 8 ? window.label : `${window.label.slice(0, 7)}…`;
}
//# sourceMappingURL=upstream-turn-telemetry.js.map