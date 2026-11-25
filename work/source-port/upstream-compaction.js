import { resolveSelectableProviderInstanceEntry, } from "../../providerInstances";
function providerSupportsManualCompaction(provider) {
    return provider?.snapshot.slashCommands.some((command) => command.name === "compact") ?? false;
}
export function hasAvailableCompactionProvider(input) {
    const driverProviders = input.providers.filter((provider) => provider.driverKind === input.driverKind);
    const lockedContinuationGroupKey = input.lockedInstanceId
        ? driverProviders.find((provider) => provider.instanceId === input.lockedInstanceId)
            ?.continuationGroupKey
        : undefined;
    const compatibleProviders = lockedContinuationGroupKey
        ? driverProviders.filter((provider) => provider.continuationGroupKey === lockedContinuationGroupKey)
        : driverProviders;
    return providerSupportsManualCompaction(resolveSelectableProviderInstanceEntry(compatibleProviders, input.instanceId ?? undefined));
}
export function formatContextWindowCompactionMessage(autoCompactThreshold) {
    if (typeof autoCompactThreshold === "number" && autoCompactThreshold > 0) {
        return `Compacts automatically at about ${autoCompactThreshold.toLocaleString("en-US")} tokens.`;
    }
    return "Context compacts automatically when needed.";
}
//# sourceMappingURL=upstream-compaction.js.map