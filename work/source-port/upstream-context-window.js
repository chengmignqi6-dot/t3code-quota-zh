export function formatContextWindowTokens(value) {
    if (value === null || !Number.isFinite(value)) {
        return "0";
    }
    if (value < 1_000) {
        return `${Math.round(value)}`;
    }
    if (value < 10_000) {
        return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    }
    if (value < 999_500) {
        return `${Math.round(value / 1_000)}k`;
    }
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}
//# sourceMappingURL=upstream-context-window.js.map