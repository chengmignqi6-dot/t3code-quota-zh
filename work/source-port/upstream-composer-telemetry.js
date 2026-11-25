import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { formatDuration, remainingPercent } from "@t3tools/shared/usageLimits";
import { RotateCwIcon } from "lucide-react";
import { useNowMinute } from "../../hooks/useNowMinute";
import { formatContextWindowTokens } from "../../lib/contextWindow";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { formatContextWindowCompactionMessage } from "./compaction.logic";
import { ComposerSurface } from "./ComposerSurface";
import { deriveContextWindowBreakdown, deriveQuotaWindowMetrics, formatCompactTokenCount, formatLatencyMs, formatShortWindowLabel, resolveModelQuotaState, } from "./turnTelemetry";
const SEGMENT_SWATCH_CLASS = {
    sky: "bg-info",
    amber: "bg-warning",
    emerald: "bg-success",
    violet: "bg-guest",
    slate: "bg-muted-foreground/45",
};
const FUEL_CELL_INDICES = Array.from({ length: 20 }, (_, index) => index);
const TELEMETRY_TRIGGER_CLASS = "inline-flex h-5 cursor-pointer items-center gap-1.5 rounded-md px-1.5 font-mono text-2xs leading-none tabular-nums text-muted-foreground/85 transition-colors outline-none hover:bg-foreground/8 hover:text-foreground focus-visible:bg-foreground/8 focus-visible:text-foreground focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground/20 data-popup-open:bg-foreground/10 data-popup-open:text-foreground";
export function hasComposerTelemetryContent(input) {
    if (input.contextWindow !== null)
        return true;
    if (input.isWorking && input.liveTurn?.ttftMs != null)
        return true;
    if (input.providerInstanceId === null)
        return false;
    return (resolveModelQuotaState({
        providerInstanceId: input.providerInstanceId,
        providers: input.providers,
        sources: input.sources,
        activeModel: input.activeModel,
        now: Date.now(),
    }).kind !== "none");
}
function formatPercent(value) {
    if (value === null || !Number.isFinite(value))
        return "0%";
    if (value > 0 && value < 0.1)
        return "<0.1%";
    if (value < 10)
        return `${value.toFixed(1)}%`;
    return `${Math.round(value)}%`;
}
function ContextSegmentsBar({ segments, maxTokens, usedPercent, autoCompactBufferPercent, tone, size, }) {
    const sizeClass = size === "mini" ? "h-1.5 w-11" : "h-2 w-full";
    const hasRealSegments = maxTokens !== null && segments.length > 0;
    const fallbackFill = usedPercent ?? 0;
    return (_jsxs("span", { "aria-hidden": true, className: cn("relative flex shrink-0 items-stretch overflow-hidden rounded-full bg-foreground/12 ring-1 ring-inset ring-foreground/10", sizeClass), children: [_jsx("span", { className: "flex min-w-0 flex-1 items-stretch gap-px", children: hasRealSegments ? (segments.map((segment) => {
                    const widthPercent = segment.percentOfMax ?? 0;
                    if (widthPercent <= 0)
                        return null;
                    return (_jsx("span", { className: cn("h-full first:rounded-s-full last:rounded-e-full", size === "full" ? "min-w-1" : "min-w-0.5", SEGMENT_SWATCH_CLASS[segment.tone]), style: { width: `${Math.max(widthPercent, size === "mini" ? 4 : 0.8)}%` } }, segment.id));
                })) : fallbackFill > 0 ? (_jsx("span", { className: cn("h-full rounded-full", tone === "error"
                        ? "bg-error"
                        : tone === "warning"
                            ? "bg-warning"
                            : "bg-foreground/70"), style: { width: `max(${fallbackFill}%, 4px)` } })) : null }), autoCompactBufferPercent !== null && autoCompactBufferPercent > 0 ? (_jsx("span", { className: "h-full shrink-0 border-s border-background/70 bg-foreground/18", style: { width: `${Math.min(40, autoCompactBufferPercent)}%` } })) : null] }));
}
function ContextBreakdownRow({ swatchClassName, label, tokens, percent, percentText, muted = false, }) {
    return (_jsxs("div", { className: "grid grid-cols-[auto_1fr_auto_3.25rem] items-center gap-x-2 text-xs tabular-nums", children: [_jsx("span", { "aria-hidden": true, className: cn("size-2.5 rounded-xs", swatchClassName) }), _jsx("span", { className: cn("truncate", muted ? "text-muted-foreground/80" : "text-muted-foreground"), children: label }), _jsx("span", { className: cn("text-end font-mono", muted ? "text-muted-foreground" : "text-foreground/95"), children: formatCompactTokenCount(tokens) }), _jsx("span", { className: "text-end font-mono text-muted-foreground/80", children: percentText ?? (percent !== null ? formatPercent(percent) : "") })] }));
}
export function ContextBreakdownCard({ usage, latestTurn, sessionCacheHitPercent = null, sessionCacheTurnCount = 0, turnCount, toolCallCount, skillCount, onCompactContext, compactDisabled = false, showTitle = true, }) {
    const breakdown = deriveContextWindowBreakdown({
        usage,
        latestTurn,
        sessionCacheHitPercent,
        sessionCacheTurnCount,
        turnCount,
        toolCallCount,
        skillCount,
    });
    const roundedPercent = breakdown.usedPercent !== null ? Math.round(breakdown.usedPercent) : null;
    const tone = roundedPercent === null
        ? null
        : roundedPercent >= 90
            ? "error"
            : roundedPercent >= 80
                ? "warning"
                : null;
    const usedLabel = formatContextWindowTokens(breakdown.usedTokens);
    const footprintParts = [];
    if (breakdown.turnCount > 0) {
        footprintParts.push(`${breakdown.turnCount} ${breakdown.turnCount === 1 ? "turn" : "turns"}`);
    }
    if (breakdown.toolCallCount > 0) {
        footprintParts.push(`${breakdown.toolCallCount} ${breakdown.toolCallCount === 1 ? "tool" : "tools"}`);
    }
    if (breakdown.skillCount > 0) {
        footprintParts.push(`${breakdown.skillCount} ${breakdown.skillCount === 1 ? "skill" : "skills"}`);
    }
    return (_jsxs("div", { className: "flex flex-col gap-2.5 py-0.5", children: [_jsxs("div", { className: "flex flex-col gap-1.5", children: [showTitle ? (_jsx("div", { className: "flex items-center justify-between gap-2", children: _jsx("span", { className: "text-xs font-medium text-foreground", children: "Context" }) })) : null, _jsxs("div", { className: "flex items-baseline justify-between gap-2 tabular-nums", children: [_jsx("span", { className: cn("text-sm font-medium", tone === "error"
                                    ? "text-error-foreground"
                                    : tone === "warning"
                                        ? "text-warning-foreground"
                                        : "text-foreground"), children: roundedPercent !== null ? `${roundedPercent}% used` : `${usedLabel} tokens` }), _jsx("span", { className: "font-mono text-xs text-muted-foreground", children: breakdown.maxTokens !== null
                                    ? `${usedLabel} / ${formatContextWindowTokens(breakdown.maxTokens)}`
                                    : breakdown.usedTokens.toLocaleString("en-US") })] }), _jsx(ContextSegmentsBar, { segments: breakdown.segments, maxTokens: breakdown.maxTokens, usedPercent: breakdown.usedPercent, autoCompactBufferPercent: breakdown.autoCompactBufferPercent, tone: tone, size: "full" })] }), breakdown.segments.length > 0 ? (_jsx("div", { className: "flex flex-col gap-1.5", children: breakdown.segments.map((segment) => (_jsx(ContextBreakdownRow, { swatchClassName: SEGMENT_SWATCH_CLASS[segment.tone], label: segment.label, tokens: segment.tokens, percent: segment.percentOfMax }, segment.id))) })) : null, breakdown.autoCompactBufferTokens !== null ||
                breakdown.freeSpaceTokens !== null ||
                breakdown.deferredRows.length > 0 ? (_jsxs("div", { className: "flex flex-col gap-1.5 border-t border-border/60 pt-2", children: [breakdown.autoCompactBufferTokens !== null ? (_jsx(ContextBreakdownRow, { swatchClassName: "bg-foreground/25", label: "Autocompact buffer", tokens: breakdown.autoCompactBufferTokens, percent: breakdown.autoCompactBufferPercent, muted: true })) : null, breakdown.freeSpaceTokens !== null ? (_jsx(ContextBreakdownRow, { swatchClassName: "bg-foreground/10 ring-1 ring-inset ring-foreground/20", label: "Free space", tokens: breakdown.freeSpaceTokens, percent: breakdown.freeSpacePercent, muted: true })) : null, breakdown.deferredRows.map((row) => (_jsx(ContextBreakdownRow, { swatchClassName: "bg-muted-foreground/35", label: row.label, tokens: row.tokens, percent: null, percentText: "-", muted: true }, row.id)))] })) : null, breakdown.lastCacheHitPercent !== null || breakdown.sessionCacheHitPercent !== null ? (_jsxs("div", { className: "flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-xs tabular-nums", children: [_jsx("span", { className: "text-muted-foreground", children: "Prompt cache" }), _jsxs("div", { className: "flex items-center gap-1.5 font-mono", children: [breakdown.lastCacheHitPercent !== null ? (_jsx("span", { className: cn(breakdown.lastCacheHitPercent < 1
                                    ? "text-warning-foreground"
                                    : breakdown.lastCacheHitPercent >= 50
                                        ? "text-info-foreground"
                                        : "text-foreground/85"), children: breakdown.lastCacheHitPercent < 1
                                    ? "0% miss"
                                    : `${Math.round(breakdown.lastCacheHitPercent)}%` })) : null, breakdown.sessionCacheHitPercent !== null && breakdown.sessionCacheTurnCount >= 2 ? (_jsxs("span", { className: "text-2xs text-muted-foreground/75", children: [breakdown.lastCacheHitPercent !== null ? "· " : "", "avg ", Math.round(breakdown.sessionCacheHitPercent), "%"] })) : null] })] })) : null, breakdown.autoCompactThreshold !== null ? (_jsx("p", { className: "text-2xs leading-relaxed text-muted-foreground/80", children: formatContextWindowCompactionMessage(breakdown.autoCompactThreshold) })) : null, footprintParts.length > 0 || onCompactContext ? (_jsxs("div", { className: "flex items-center justify-between gap-2 border-t border-border/60 pt-2", children: [_jsx("div", { className: "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-2xs tabular-nums text-muted-foreground", children: footprintParts.length > 0 ? _jsx("span", { children: footprintParts.join(" · ") }) : null }), onCompactContext && !compactDisabled ? (_jsx(Button, { size: "xs", variant: "ghost", onClick: onCompactContext, children: "Compact" })) : null] })) : null] }));
}
function ContextWindowControl({ usage, latestTurn, sessionCacheHitPercent, sessionCacheTurnCount, turnCount, toolCallCount, skillCount, compact, onCompactContext, compactDisabled, }) {
    const breakdown = deriveContextWindowBreakdown({
        usage,
        latestTurn,
        sessionCacheHitPercent,
        sessionCacheTurnCount,
        turnCount,
        toolCallCount,
        skillCount,
    });
    const roundedPercent = breakdown.usedPercent !== null ? Math.round(breakdown.usedPercent) : null;
    const tone = roundedPercent === null
        ? null
        : roundedPercent >= 90
            ? "error"
            : roundedPercent >= 80
                ? "warning"
                : null;
    const usedLabel = formatContextWindowTokens(breakdown.usedTokens);
    const ratioLabel = breakdown.maxTokens !== null
        ? `${usedLabel}/${formatContextWindowTokens(breakdown.maxTokens)}`
        : usedLabel;
    return (_jsxs(Popover, { children: [_jsxs(PopoverTrigger, { render: _jsx("button", { type: "button", "data-composer-telemetry": "context", "aria-label": roundedPercent !== null
                        ? `Context window: ${roundedPercent}% used (${ratioLabel})`
                        : `Context window: ${usedLabel} tokens`, className: TELEMETRY_TRIGGER_CLASS }), children: [!compact ? _jsx("span", { className: "font-sans text-muted-foreground/75", children: "Ctx" }) : null, _jsx(ContextSegmentsBar, { segments: breakdown.segments, maxTokens: breakdown.maxTokens, usedPercent: breakdown.usedPercent, autoCompactBufferPercent: breakdown.autoCompactBufferPercent, tone: tone, size: "mini" }), _jsx("span", { className: cn(tone === "error"
                            ? "text-error-foreground"
                            : tone === "warning"
                                ? "text-warning-foreground"
                                : "text-foreground/85"), children: ratioLabel }), roundedPercent !== null ? (_jsxs("span", { className: "text-muted-foreground/70", children: [roundedPercent, "%"] })) : null] }), _jsx(PopoverPopup, { side: "top", align: "start", sideOffset: 8, width: "sm", padding: "compact", children: _jsx(ContextBreakdownCard, { usage: usage, latestTurn: latestTurn, sessionCacheHitPercent: sessionCacheHitPercent, sessionCacheTurnCount: sessionCacheTurnCount, turnCount: turnCount, toolCallCount: toolCallCount, skillCount: skillCount, onCompactContext: onCompactContext, compactDisabled: compactDisabled ?? false }) })] }));
}
/** Circular watch-complication gauge with a rim bead anchored to the remaining quota arc tip. */
function QuotaArcDial({ remaining, tone, paceTone = "neutral", size = "sm", }) {
    const px = size === "md" ? 20 : 15;
    const radius = 5.6;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, remaining));
    const strokeDashoffset = circumference * (1 - clamped / 100);
    const tipAngleRad = ((clamped / 100) * 360 - 90) * (Math.PI / 180);
    const tipX = 8 + radius * Math.cos(tipAngleRad);
    const tipY = 8 + radius * Math.sin(tipAngleRad);
    const arcColorClass = tone === "error"
        ? "text-error"
        : tone === "warning" || paceTone === "fast"
            ? "text-warning"
            : paceTone === "good"
                ? "text-success"
                : "text-foreground/85";
    return (_jsxs("svg", { width: px, height: px, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true, className: "shrink-0", children: [_jsx("circle", { cx: "8", cy: "8", r: radius, stroke: "currentColor", strokeWidth: "1.9", className: "text-foreground/15" }), clamped > 0 ? (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "8", cy: "8", r: radius, stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: strokeDashoffset, transform: "rotate(-90 8 8)", className: arcColorClass }), _jsx("circle", { cx: tipX, cy: tipY, r: "1.5", className: "fill-background stroke-foreground", strokeWidth: "0.95" })] })) : null] }));
}
function QuotaFuelInstrument({ window, now, }) {
    const metrics = deriveQuotaWindowMetrics(window, now);
    const tone = metrics.remaining <= 10 ? "error" : metrics.remaining <= 20 ? "warning" : null;
    const isFastBurn = metrics.pace === "ahead" || (metrics.headroomDelta !== null && metrics.headroomDelta <= -10);
    const isUnderPace = metrics.pace === "under" || (metrics.headroomDelta !== null && metrics.headroomDelta >= 8);
    const paceTone = isFastBurn ? "fast" : isUnderPace ? "good" : "neutral";
    const filledCellClass = tone === "error"
        ? "bg-error"
        : tone === "warning" || isFastBurn
            ? "bg-warning"
            : isUnderPace
                ? "bg-success"
                : "bg-foreground/80";
    return (_jsxs("div", { className: "flex flex-col gap-1.5 rounded-lg bg-foreground/5 px-2.5 py-2 ring-1 ring-inset ring-foreground/8", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 tabular-nums", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-1.5", children: [_jsx(QuotaArcDial, { remaining: metrics.remaining, tone: tone, paceTone: paceTone, size: "md" }), _jsx("span", { className: "truncate text-xs font-medium text-foreground", children: window.label })] }), _jsxs("span", { className: cn("shrink-0 font-mono text-sm font-medium", tone === "error"
                            ? "text-error-foreground"
                            : tone === "warning"
                                ? "text-warning-foreground"
                                : "text-foreground"), children: [metrics.remaining, "%"] })] }), _jsx("div", { className: "flex items-center gap-0.5", "aria-hidden": true, children: FUEL_CELL_INDICES.map((cellIndex) => {
                    const cellFloor = cellIndex * 5;
                    const cellFull = metrics.remaining >= cellFloor + 5;
                    const cellPartial = !cellFull && metrics.remaining > cellFloor;
                    return (_jsx("span", { className: cn("h-2.5 flex-1 rounded-xs transition-colors", cellFull
                            ? filledCellClass
                            : cellPartial
                                ? cn(filledCellClass, "opacity-45")
                                : "bg-foreground/10") }, cellIndex));
                }) }), metrics.timeRemaining !== null ? (_jsxs("div", { className: "relative flex h-2.5 items-center", "aria-hidden": true, children: [_jsx("span", { className: "h-px w-full bg-foreground/15" }), _jsx("span", { className: "absolute left-0 h-px bg-foreground/45", style: { width: `${metrics.timeRemaining}%` } }), _jsx("span", { className: "absolute h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground", style: { left: `${metrics.timeRemaining}%` } })] })) : null, _jsx("div", { className: "flex items-center text-2xs tabular-nums text-muted-foreground", children: _jsx("span", { className: "truncate", children: window.resetsAt && metrics.resetsInMs !== null
                        ? `Resets in ${formatDuration(metrics.resetsInMs)}`
                        : `${metrics.used}% used` }) })] }));
}
function SiblingQuotaRow({ window, now, }) {
    const left = remainingPercent(window);
    const metrics = deriveQuotaWindowMetrics(window, now);
    const tone = left <= 10 ? "error" : left <= 20 ? "warning" : null;
    return (_jsxs("div", { className: "grid grid-cols-[minmax(4.5rem,1fr)_4rem_2.25rem] items-center gap-2 text-2xs tabular-nums", children: [_jsx("span", { className: "truncate text-muted-foreground", children: window.label }), _jsxs("span", { className: "relative h-1.5 rounded-full bg-foreground/12", children: [left > 0 ? (_jsx("span", { className: cn("absolute inset-y-0 left-0 rounded-full", tone === "error"
                            ? "bg-error"
                            : tone === "warning"
                                ? "bg-warning"
                                : "bg-foreground/70"), style: { width: `max(${left}%, 3px)` } })) : null, metrics.timeRemaining !== null ? (_jsx("span", { className: "absolute -top-0.5 h-2.5 w-px -translate-x-1/2 bg-foreground/75", style: { left: `${metrics.timeRemaining}%` } })) : null] }), _jsxs("span", { className: cn("text-end font-mono", tone === "error"
                    ? "text-error-foreground"
                    : tone === "warning"
                        ? "text-warning-foreground"
                        : "text-foreground/90"), children: [left, "%"] })] }));
}
function OtherSubscriptionBlock({ subscription, now, }) {
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 text-2xs", children: [_jsx("span", { className: "font-medium text-foreground/90", children: subscription.label }), subscription.plan ? (_jsx("span", { className: "text-muted-foreground/75", children: subscription.plan })) : null] }), subscription.windows.map((window) => (_jsx(SiblingQuotaRow, { window: window, now: now }, window.id)))] }));
}
function QuotaRefreshButton({ onRefresh, isRefreshing = false, }) {
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { render: _jsx("button", { type: "button", onClick: onRefresh, disabled: isRefreshing, "aria-label": "Refresh quota", "data-quota-refresh": true, className: "inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground/80 transition-colors outline-none hover:bg-foreground/8 hover:text-foreground focus-visible:bg-foreground/8 focus-visible:text-foreground focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground/20 disabled:pointer-events-none disabled:opacity-60" }), children: _jsx(RotateCwIcon, { className: cn("size-3", isRefreshing && "animate-spin text-foreground/90") }) }), _jsx(TooltipPopup, { side: "top", children: "Refresh quota" })] }));
}
export function ModelQuotaDetailCard({ quota, now, onOpenUsageLimits, onRefreshQuota, isRefreshingQuota = false, }) {
    if (quota.kind === "unmetered-model") {
        return (_jsxs("div", { className: "flex flex-col gap-2.5 py-0.5", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "truncate text-xs font-medium text-foreground", children: quota.modelLabel ?? quota.vendorLabel }), _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [_jsxs("span", { className: "shrink-0 rounded bg-foreground/8 px-1.5 py-0.5 font-mono text-2xs text-muted-foreground", children: [quota.vendorLabel, " \u00B7 API"] }), onRefreshQuota ? (_jsx(QuotaRefreshButton, { onRefresh: onRefreshQuota, isRefreshing: isRefreshingQuota })) : null] })] }), _jsx("p", { className: "text-2xs leading-relaxed text-muted-foreground", children: quota.reason })] }), quota.otherSubscriptions.length > 0 ? (_jsxs("div", { className: "flex flex-col gap-2 border-t border-border/60 pt-2", children: [_jsx("span", { className: "text-2xs font-medium text-muted-foreground/80", children: "Other active subscriptions" }), quota.otherSubscriptions.map((subscription) => (_jsx(OtherSubscriptionBlock, { subscription: subscription, now: now }, subscription.instanceId)))] })) : null] }));
    }
    return (_jsxs("div", { className: "flex flex-col gap-2.5 py-0.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-1.5", children: [_jsxs("span", { className: "truncate text-xs font-medium text-foreground", children: [quota.label, quota.modelLabel ? ` · ${quota.modelLabel}` : ""] }), quota.sourceLabel || quota.isRoutedMatch ? (_jsx("span", { className: "shrink-0 rounded bg-foreground/8 px-1 py-0.5 font-mono text-2xs text-muted-foreground", children: quota.sourceLabel ?? "routed" })) : null] }), quota.plan || onRefreshQuota ? (_jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [quota.plan ? (_jsx("span", { className: "shrink-0 text-2xs text-muted-foreground", children: quota.plan })) : null, onRefreshQuota ? (_jsx(QuotaRefreshButton, { onRefresh: onRefreshQuota, isRefreshing: isRefreshingQuota })) : null] })) : null] }), quota.unavailableNotice ? (_jsx("p", { className: "text-xs text-muted-foreground", children: quota.unavailableNotice })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex flex-col gap-2", children: quota.primaryWindows.map((window) => (_jsx(QuotaFuelInstrument, { window: window, now: now }, window.id))) }), quota.siblingWindows.length > 0 ? (_jsxs("div", { className: "flex flex-col gap-1.5 border-t border-border/60 pt-2", children: [_jsx("span", { className: "text-2xs text-muted-foreground/75", children: "Other model pools" }), quota.siblingWindows.map((window) => (_jsx(SiblingQuotaRow, { window: window, now: now }, window.id)))] })) : null] })), onOpenUsageLimits && !quota.isRoutedMatch ? (_jsx("div", { className: "flex items-center justify-end border-t border-border/60 pt-1.5", children: _jsx(Button, { size: "xs", variant: "ghost", onClick: onOpenUsageLimits, children: "Full limits panel" }) })) : null] }));
}
function SubscriptionQuotaControl({ providerInstanceId, activeModel, providers, sources, onOpenUsageLimits, onRefreshQuota, isRefreshingQuota = false, }) {
    const nowMinute = useNowMinute();
    const now = Date.parse(`${nowMinute}:00Z`);
    const quota = resolveModelQuotaState({
        providerInstanceId,
        providers,
        sources,
        activeModel,
        now,
    });
    if (quota.kind === "none")
        return null;
    if (quota.kind === "unmetered-model") {
        const badgeText = quota.vendorLabel.toLowerCase() === "api" ? "API" : `${quota.vendorLabel} · API`;
        return (_jsxs(Popover, { children: [_jsxs(PopoverTrigger, { render: _jsx("button", { type: "button", "data-composer-telemetry": "quota", "aria-label": `Model quota: ${badgeText}`, className: TELEMETRY_TRIGGER_CLASS }), children: [_jsx("span", { "aria-hidden": true, className: "size-2 rounded-full ring-1 ring-inset ring-foreground/45" }), _jsx("span", { className: "text-muted-foreground/90", children: badgeText })] }), _jsx(PopoverPopup, { side: "top", align: "end", sideOffset: 8, width: "md", padding: "compact", children: _jsx(ModelQuotaDetailCard, { quota: quota, now: now, onRefreshQuota: onRefreshQuota, isRefreshingQuota: isRefreshingQuota }) })] }));
    }
    const inlineWindows = quota.primaryWindows.slice(0, 2);
    const overflowCount = Math.max(0, quota.primaryWindows.length + quota.siblingWindows.length - inlineWindows.length);
    const summaryLabel = quota.unavailableNotice
        ? `${quota.label} quota unavailable`
        : inlineWindows.map((window) => `${window.label} ${remainingPercent(window)}% left`).join(", ");
    return (_jsxs(Popover, { children: [_jsxs(PopoverTrigger, { render: _jsx("button", { type: "button", "data-composer-telemetry": "quota", "aria-label": summaryLabel, className: TELEMETRY_TRIGGER_CLASS }), children: [quota.unavailableNotice ? (_jsxs(_Fragment, { children: [_jsx("span", { "aria-hidden": true, className: "size-2 rounded-full ring-1 ring-inset ring-muted-foreground/50" }), _jsxs("span", { className: "text-muted-foreground/80", children: [quota.label, " \u00B7 offline"] })] })) : (inlineWindows.map((window, index) => {
                        const metrics = deriveQuotaWindowMetrics(window, now);
                        const tone = metrics.remaining <= 10 ? "error" : metrics.remaining <= 20 ? "warning" : null;
                        const paceTone = metrics.pace === "ahead" ||
                            (metrics.headroomDelta !== null && metrics.headroomDelta <= -10)
                            ? "fast"
                            : metrics.pace === "under" ||
                                (metrics.headroomDelta !== null && metrics.headroomDelta >= 8)
                                ? "good"
                                : "neutral";
                        return (_jsxs("span", { className: "inline-flex items-center gap-1", children: [index > 0 ? (_jsx("span", { "aria-hidden": true, className: "mx-0.5 text-muted-foreground/30", children: "\u00B7" })) : null, _jsx(QuotaArcDial, { remaining: metrics.remaining, tone: tone, paceTone: paceTone }), _jsx("span", { className: "text-muted-foreground/70", children: formatShortWindowLabel(window) }), _jsxs("span", { className: cn(tone === "error"
                                        ? "text-error-foreground"
                                        : tone === "warning"
                                            ? "text-warning-foreground"
                                            : "text-foreground/85"), children: [metrics.remaining, "%"] })] }, window.id));
                    })), !quota.unavailableNotice && overflowCount > 0 ? (_jsxs("span", { className: "text-muted-foreground/55", children: ["+", overflowCount] })) : null] }), _jsx(PopoverPopup, { side: "top", align: "end", sideOffset: 8, width: "md", padding: "compact", children: _jsx(ModelQuotaDetailCard, { quota: quota, now: now, onOpenUsageLimits: onOpenUsageLimits, onRefreshQuota: onRefreshQuota, isRefreshingQuota: isRefreshingQuota }) })] }));
}
export function ComposerTelemetryStrip({ contextWindow, providerInstanceId, activeModel, providers, sources, isWorking, liveTurn, latestCacheTurn = null, sessionCacheHitPercent = null, sessionCacheTurnCount = 0, turnCount, toolCallCount, skillCount, onOpenUsageLimits, onRefreshQuota, isRefreshingQuota = false, onCompactContext, compactDisabled = false, inline = false, }) {
    const liveTtftMs = isWorking ? (liveTurn?.ttftMs ?? null) : null;
    const contextCacheTurn = latestCacheTurn ?? liveTurn;
    const hasAny = hasComposerTelemetryContent({
        contextWindow,
        providerInstanceId,
        providers,
        sources,
        activeModel,
        isWorking,
        liveTurn,
    });
    if (!hasAny)
        return null;
    if (inline) {
        return (_jsxs("div", { "data-slot": "composer-telemetry-inline", className: "flex shrink-0 items-center gap-0.5 text-muted-foreground", children: [contextWindow ? (_jsx(ContextWindowControl, { usage: contextWindow, latestTurn: contextCacheTurn, sessionCacheHitPercent: sessionCacheHitPercent, sessionCacheTurnCount: sessionCacheTurnCount, turnCount: turnCount, toolCallCount: toolCallCount, skillCount: skillCount, compact: true, onCompactContext: onCompactContext, compactDisabled: compactDisabled })) : null, _jsx(SubscriptionQuotaControl, { providerInstanceId: providerInstanceId, activeModel: activeModel, providers: providers, sources: sources, onOpenUsageLimits: onOpenUsageLimits, onRefreshQuota: onRefreshQuota, isRefreshingQuota: isRefreshingQuota })] }));
    }
    return (_jsxs(ComposerSurface.ContextStrip, { "data-slot": "composer-telemetry-strip", className: "justify-between gap-2 pt-1.5 pb-0.5", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-1.5", children: [contextWindow ? (_jsx(ContextWindowControl, { usage: contextWindow, latestTurn: contextCacheTurn, sessionCacheHitPercent: sessionCacheHitPercent, sessionCacheTurnCount: sessionCacheTurnCount, turnCount: turnCount, toolCallCount: toolCallCount, skillCount: skillCount, compact: false, onCompactContext: onCompactContext, compactDisabled: compactDisabled })) : null, liveTtftMs !== null ? (_jsxs("span", { "data-composer-telemetry": "live-ttft", className: "inline-flex h-5 items-center gap-1 px-1 font-mono text-2xs leading-none tabular-nums text-muted-foreground/70", children: [contextWindow ? (_jsx("span", { "aria-hidden": true, className: "me-0.5 text-muted-foreground/35", children: "\u00B7" })) : null, _jsx("span", { className: "text-muted-foreground/55", children: "TTFT" }), _jsx("span", { children: formatLatencyMs(liveTtftMs) })] })) : null] }), _jsx("div", { className: "ms-auto flex shrink-0 items-center", children: _jsx(SubscriptionQuotaControl, { providerInstanceId: providerInstanceId, activeModel: activeModel, providers: providers, sources: sources, onOpenUsageLimits: onOpenUsageLimits, onRefreshQuota: onRefreshQuota, isRefreshingQuota: isRefreshingQuota }) })] }));
}
//# sourceMappingURL=upstream-composer-telemetry.js.map