import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { formatCompactTokenCount, formatLatencyMs, formatTps, hasVisibleTurnTelemetry, } from "./turnTelemetry";
function TelemetryDetailRow({ label, value }) {
    return (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-muted-foreground", children: label }), _jsx("span", { className: "text-end font-mono text-foreground", children: value })] }));
}
export function TurnTelemetryMeta({ telemetry, className, }) {
    if (!hasVisibleTurnTelemetry(telemetry) || telemetry === null)
        return null;
    const showEndToEndTps = telemetry.endToEndTps !== null &&
        telemetry.generationTps !== null &&
        Math.abs(telemetry.generationTps - telemetry.endToEndTps) / telemetry.generationTps >= 0.08;
    const durationSummary = (() => {
        const parts = [];
        if (telemetry.generationDurationMs !== null) {
            parts.push(`${formatLatencyMs(telemetry.generationDurationMs)} gen`);
        }
        if (telemetry.toolDurationMs !== null && telemetry.toolDurationMs >= 100) {
            parts.push(`${formatLatencyMs(telemetry.toolDurationMs)} tools`);
        }
        if (parts.length === 0 && telemetry.totalDurationMs !== null) {
            parts.push(formatLatencyMs(telemetry.totalDurationMs));
        }
        return parts.length > 0 ? parts.join(" · ") : null;
    })();
    const outputSummary = telemetry.outputTokens !== null
        ? telemetry.reasoningTokens !== null && telemetry.reasoningTokens > 0
            ? `${formatCompactTokenCount(telemetry.outputTokens)} (${formatCompactTokenCount(telemetry.reasoningTokens)} think)`
            : formatCompactTokenCount(telemetry.outputTokens)
        : null;
    const inputSummary = telemetry.inputTokens !== null
        ? telemetry.cacheHitPercent !== null && telemetry.cacheHitPercent >= 1
            ? `${formatCompactTokenCount(telemetry.inputTokens)} (${Math.round(telemetry.cacheHitPercent)}% cache)`
            : formatCompactTokenCount(telemetry.inputTokens)
        : null;
    const ariaParts = [];
    if (telemetry.ttftMs !== null)
        ariaParts.push(`TTFT ${formatLatencyMs(telemetry.ttftMs)}`);
    if (telemetry.generationTps !== null)
        ariaParts.push(formatTps(telemetry.generationTps));
    return (_jsx(TooltipProvider, { delay: 150, children: _jsxs(Tooltip, { children: [_jsxs(TooltipTrigger, { render: _jsx("span", { tabIndex: 0, "data-turn-telemetry": "true", "aria-label": ariaParts.join(", "), className: cn("inline-flex cursor-default items-center gap-1.5 rounded px-1 py-0.5 font-mono text-2xs leading-none tabular-nums text-muted-foreground/65 transition-colors outline-none hover:text-foreground focus-visible:bg-foreground/10 focus-visible:text-foreground focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground/25", className) }), children: [telemetry.ttftMs !== null ? (_jsxs("span", { children: [_jsx("span", { className: "text-muted-foreground/55", children: "TTFT" }), " ", formatLatencyMs(telemetry.ttftMs)] })) : null, telemetry.ttftMs !== null && telemetry.generationTps !== null ? (_jsx("span", { "aria-hidden": true, className: "text-muted-foreground/35", children: "\u00B7" })) : null, telemetry.generationTps !== null ? (_jsx("span", { children: formatTps(telemetry.generationTps) })) : null] }), _jsx(TooltipPopup, { side: "top", align: "end", variant: "glass", children: _jsxs("div", { className: "grid min-w-48 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-0.5 py-1 text-xs tabular-nums", children: [telemetry.ttftMs !== null ? (_jsx(TelemetryDetailRow, { label: "TTFT", value: formatLatencyMs(telemetry.ttftMs) })) : null, telemetry.firstAnswerMs !== null ? (_jsx(TelemetryDetailRow, { label: "First answer", value: formatLatencyMs(telemetry.firstAnswerMs) })) : null, telemetry.generationTps !== null ? (_jsx(TelemetryDetailRow, { label: "Gen speed", value: formatTps(telemetry.generationTps) })) : null, showEndToEndTps && telemetry.endToEndTps !== null ? (_jsx(TelemetryDetailRow, { label: "End-to-end", value: formatTps(telemetry.endToEndTps) })) : null, outputSummary !== null ? (_jsx(TelemetryDetailRow, { label: "Output", value: outputSummary })) : null, inputSummary !== null ? (_jsx(TelemetryDetailRow, { label: "Input", value: inputSummary })) : null, durationSummary !== null ? (_jsx(TelemetryDetailRow, { label: "Duration", value: durationSummary })) : null, telemetry.totalDurationMs !== null &&
                                telemetry.toolDurationMs !== null &&
                                telemetry.toolDurationMs >= 100 ? (_jsx(TelemetryDetailRow, { label: "Wall time", value: formatLatencyMs(telemetry.totalDurationMs) })) : null] }) })] }) }));
}
//# sourceMappingURL=upstream-turn-telemetry-meta.js.map