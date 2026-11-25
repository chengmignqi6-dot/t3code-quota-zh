import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CHATGPT_USAGE_URL, collectLimitAccounts, collectExternalUsageLinks, collectLimitNotices, collectLimitPools, cursorUsageWindowDetails, displayLimitWindows, formatResetsIn, paceRemainingPercent, remainingPercent, resetCreditChoices, } from "@t3tools/shared/usageLimits";
import { normalizeProviderAccentColor } from "@t3tools/client-runtime/state/provider-instance-display";
import { AlertTriangleIcon, ExternalLinkIcon, TicketIcon } from "lucide-react";
import { createContext, Fragment, use, useLayoutEffect, useRef, useState, } from "react";
import { ensureLocalApi } from "../../localApi";
import { usePrimarySettings } from "../../hooks/useSettings";
import { cn } from "../../lib/utils";
import { formatUpcomingTimestamp } from "../../timestampFormat";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";
import { RedactedSensitiveText } from "../settings/RedactedSensitiveText";
import { Button } from "../ui/button";
import { OpenAI } from "../Icons";
import { Alert, AlertTitle } from "../ui/alert";
import { Popover, PopoverCreateHandle, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { PaceIcon, ResetCreditDialog, barColor, usePaceMark, useResetCredit } from "./UsageLimits";
function accountInitials(email) {
    const [local = "", domain = ""] = email.split("@");
    return `${local[0] ?? ""}${domain[0] ?? ""}`.toUpperCase() || "?";
}
function accountHue(email) {
    let hash = 0;
    for (let index = 0; index < email.length; index += 1) {
        hash = (hash * 31 + email.charCodeAt(index)) | 0;
    }
    return Math.abs(hash) % 360;
}
function AccountChip({ email }) {
    const hue = accountHue(email);
    return (_jsx("span", { role: "img", "aria-label": `Account ${accountInitials(email)}`, className: "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-3xs leading-none font-semibold", style: { backgroundColor: `oklch(0.85 0.08 ${hue})`, color: `oklch(0.35 0.1 ${hue})` }, children: accountInitials(email) }));
}
function AccountAvatar({ account, className, }) {
    if (account.redeem) {
        return (_jsx(ProviderInstanceIcon, { driverKind: account.driver, displayName: account.displayName ??
                providerClients.get(account.driver)?.label ??
                String(account.driver), accentColor: account.accentColor, showBadge: Boolean(account.displayName), indicatorBackground: "var(--popover)", className: cn("size-5", className), iconClassName: "size-4 text-foreground/80" }));
    }
    return account.email ? _jsx(AccountChip, { email: account.email }) : null;
}
function AccountName({ account, className, }) {
    if (account.displayName)
        return _jsx("span", { className: className, children: account.displayName });
    if (account.email) {
        return (_jsx("span", { className: cn("inline-flex min-w-0 items-center", className), children: _jsx(AccountChip, { email: account.email }) }));
    }
    return (_jsx("span", { className: className, children: providerClients.get(account.driver)?.label ?? String(account.driver) }));
}
function Row({ label, children }) {
    return (_jsxs("div", { className: "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3", children: [_jsx("span", { className: "text-muted-foreground", children: label }), _jsx("span", { className: "min-w-0 text-foreground tabular-nums", children: children })] }));
}
function SegmentPopover({ account, window, reset, now, redeem, onRedeem, }) {
    const timestampFormat = usePrimarySettings((settings) => settings.timestampFormat);
    const remaining = remainingPercent(window);
    const timeLeft = paceRemainingPercent(window, now);
    const resetsIn = formatResetsIn(window, now);
    const where = account.environments.length > 0
        ? account.environments.map((environment) => environment.label).join(", ")
        : account.sourceLabel;
    const choices = redeem && account.redeem && account.limits.resetCredits?.availableCount
        ? resetCreditChoices(account.limits.resetCredits, account.redeem.input, now, true)
        : [];
    return (_jsxs("div", { className: "flex w-72 max-w-[calc(100vw-3rem)] flex-col gap-2.5 text-xs", children: [_jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [_jsx(AccountAvatar, { account: account }), _jsx("span", { className: "truncate", children: account.displayName ?? providerClients.get(account.driver)?.label ?? account.driver })] }), account.email ? (_jsx(RedactedSensitiveText, { value: account.email, ariaLabel: "Toggle account email visibility", revealTooltip: "Click to reveal email", hideTooltip: "Click to hide email", className: "w-fit" })) : null] }), _jsxs("div", { className: "flex flex-col gap-1 border-t border-border/60 pt-2.5", children: [account.plan ? _jsx(Row, { label: "Plan", children: account.plan }) : null, where ? (_jsx(Row, { label: account.environments.length > 0 ? "Signed in" : "Via", children: where })) : null] }), _jsxs("div", { className: "flex flex-col gap-1 border-t border-border/60 pt-2.5", children: [_jsxs(Row, { label: "Left", children: [remaining, "%"] }), window.resetsAt ? (_jsxs(Row, { label: "Resets", children: [formatUpcomingTimestamp(window.resetsAt, timestampFormat, now), resetsIn ? ` · ${resetsIn.replace("resets in ", "in ")}` : ""] })) : null, timeLeft !== null ? _jsxs(Row, { label: "Even pace", children: [timeLeft, "% left by now"] }) : null, reset && reset.restoresPercent > 0 ? (_jsxs(Row, { label: "Restores", children: ["+", reset.restoresPercent, "% of pool"] })) : null] }), choices.length > 0 && redeem ? (_jsx("div", { className: "flex flex-col gap-1.5 border-t border-border/60 pt-2.5 text-muted-foreground", children: choices.map((choice) => (_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "tabular-nums", children: choice.summary }), choice.availableCount > 0 ? (_jsx(Button, { size: "xs", variant: "outline", disabled: redeem.busy || !redeem.canManageProviders, className: "ms-auto", onClick: () => onRedeem(choice), children: redeem.busy ? "Using…" : choice.actionLabel })) : null] }, choice.key))) })) : null] }));
}
const SegmentPopoverContext = createContext(null);
function ActiveSegmentPopover({ handle, actions, payload, pools, now, }) {
    const available = pools.some((pool) => displayLimitWindows(pool).some((window) => window.members.some((member) => member.account.key === payload.account.key &&
        member.window.id === payload.window.id &&
        member.window.kind === payload.window.kind &&
        Boolean(member.account.redeem) === Boolean(payload.redeem))));
    // The trigger is gone, so the popup has nothing to anchor to: an exit transition would
    // slide it to the viewport origin. Unmount it outright, which also clears Base UI's
    // active-trigger bookkeeping so the segment can open again when it comes back.
    // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- closes the popover handle and unmounts the Base UI popup before paint when its trigger is gone
    useLayoutEffect(() => {
        if (available)
            return;
        handle.close();
        actions.current?.unmount();
    }, [available, handle, actions]);
    return (_jsx(PopoverPopup, { side: "top", sideOffset: 6, children: _jsx(SegmentPopover, { ...payload, now: now, onRedeem: (choice) => {
                handle.close();
                payload.redeem?.confirm(choice);
            } }) }));
}
/**
 * The confirm is a sibling of the popover, not a child: dialogs stack under
 * popovers, and the popover closes as the confirm opens.
 */
function PoolSegment({ account, ...props }) {
    return account.redeem ? (_jsx(RedeemableSegment, { account: account, redeemAt: account.redeem, ...props })) : (_jsx(SegmentTriggers, { account: account, redeem: null, ...props }));
}
function RedeemableSegment({ redeemAt, ...props }) {
    const redeem = useResetCredit(redeemAt.environmentId);
    return (_jsxs(_Fragment, { children: [_jsx(SegmentTriggers, { redeem: redeem, ...props }), _jsx(ResetCreditDialog, { open: redeem.confirming, onOpenChange: redeem.setConfirming, choice: redeem.choice, onConfirm: () => void redeem.redeem(), disabled: !redeem.canManageProviders }), redeem.busy || redeem.status ? (_jsxs("span", { role: "status", className: "col-span-full text-xs text-muted-foreground", children: [_jsx(AccountName, { account: props.account, className: "font-medium text-foreground" }), " ", redeem.busy ? "Using reset credit…" : redeem.status] })) : null] }));
}
function SegmentTriggers({ account, window, reset, redeem, refillPercent, color, now, index, showAccountName, }) {
    const popover = use(SegmentPopoverContext) ?? undefined;
    const payload = { account, window, reset, redeem };
    const remaining = remainingPercent(window);
    const timeLeft = paceRemainingPercent(window, now);
    const [segmentRef, paceMark] = usePaceMark(timeLeft);
    const resetsIn = formatResetsIn(window, now);
    const credits = account.limits.resetCredits?.availableCount ?? 0;
    return (_jsxs(_Fragment, { children: [_jsxs(PopoverTrigger, { handle: popover, payload: payload, openOnHover: true, render: _jsx("button", { ref: segmentRef, type: "button", style: { gridColumn: index, gridRow: 1, ...paceMark?.gappedTrack }, "aria-label": `${account.displayName ?? (account.email ? accountInitials(account.email) : account.driver)}: ${remaining}% left${resetsIn ? `, ${resetsIn}` : ""}${timeLeft === null ? "" : `, ${timeLeft}% of the window left`}${credits ? `, ${credits} reset ${credits === 1 ? "credit" : "credits"} banked` : ""}`, className: "relative h-5 min-w-0 cursor-pointer rounded-md bg-muted text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[popup-open]:ring-1 data-[popup-open]:ring-inset data-[popup-open]:ring-border @2xl/pool:h-8" }), children: [_jsx("div", { "aria-hidden": true, className: "absolute inset-0 overflow-hidden rounded-md", children: _jsxs("div", { className: "absolute inset-0", style: paceMark?.gap, children: [_jsx("div", { "aria-hidden": true, className: "absolute inset-y-0 left-0 rounded-md opacity-35", style: { width: `${remaining}%`, backgroundColor: color } }), remaining < 100 && reset && refillPercent > 0 ? (_jsx("div", { "aria-hidden": true, className: "absolute inset-y-0 right-0 opacity-20", style: {
                                        width: `${Math.min(100 - remaining, refillPercent)}%`,
                                        backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px 5px)`,
                                    } })) : null] }) }), paceMark ? (_jsx("span", { "aria-hidden": true, className: "absolute inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground", style: paceMark.tick })) : null, _jsx("span", { "aria-hidden": true, className: "absolute inset-0 flex items-center justify-center overflow-hidden rounded-md text-3xs leading-none font-semibold text-foreground/80 tabular-nums @2xl/pool:hidden", children: index }), _jsxs("div", { className: "relative hidden h-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs @2xl/pool:flex", children: [showAccountName ? (_jsx(AccountName, { account: account, className: "min-w-0 truncate font-medium text-foreground" })) : null, showAccountName ? (_jsxs("span", { className: "shrink-0 font-semibold text-foreground tabular-nums", children: [remaining, "%"] })) : null, resetsIn || credits ? (_jsxs("span", { className: "ms-auto flex min-w-0 items-center gap-1.5 overflow-hidden rounded-sm bg-background/85 px-1.5 py-0.5 text-2xs whitespace-nowrap text-foreground tabular-nums", children: [resetsIn?.replace("resets in ", "↻ ") ?? "", credits ? (_jsxs(_Fragment, { children: [resetsIn ? (_jsx("span", { "aria-hidden": true, className: "text-muted-foreground", children: "\u00B7" })) : null, _jsxs("span", { "aria-hidden": true, className: "inline-flex items-center gap-0.5 font-semibold", children: [_jsx(TicketIcon, { className: "size-3", "aria-hidden": true }), credits] })] })) : null] })) : null] })] }), _jsx(LegendRow, { payload: payload, color: color, now: now, index: index })] }));
}
function LegendRow({ payload, color, now, index, }) {
    const popover = use(SegmentPopoverContext) ?? undefined;
    const { account, window } = payload;
    const remaining = remainingPercent(window);
    const resetsIn = formatResetsIn(window, now);
    const credits = account.limits.resetCredits?.availableCount ?? 0;
    return (_jsxs(PopoverTrigger, { handle: popover, payload: payload, style: { gridColumn: "1 / -1", gridRow: index + 1 }, render: _jsx(Button, { variant: "ghost", size: "compact" }), className: "min-w-0 @2xl/pool:hidden", children: [_jsxs("span", { className: "relative inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-3xs leading-none font-semibold text-foreground/80 tabular-nums", children: [_jsx("span", { "aria-hidden": true, className: "absolute inset-0 rounded-sm opacity-35", style: { backgroundColor: color } }), _jsx("span", { className: "sr-only", children: "Segment " }), _jsx("span", { className: "relative", children: index })] }), _jsx(AccountName, { account: account, className: "min-w-0 truncate font-medium text-foreground" }), _jsxs("span", { className: "shrink-0 font-semibold text-foreground tabular-nums", children: [remaining, "%"] }), _jsxs("span", { className: "ms-auto flex shrink-0 items-center gap-1.5 text-2xs text-muted-foreground tabular-nums", children: [resetsIn?.replace("resets in ", "↻ ") ?? "", credits ? (_jsxs(_Fragment, { children: [resetsIn ? _jsx("span", { "aria-hidden": true, children: "\u00B7" }) : null, _jsxs("span", { "aria-hidden": true, className: "inline-flex items-center gap-0.5 font-semibold text-foreground", children: [_jsx(TicketIcon, { className: "size-3", "aria-hidden": true }), credits] }), _jsxs("span", { className: "sr-only", children: [credits, " reset ", credits === 1 ? "credit" : "credits", " banked"] })] })) : null] })] }));
}
function PoolBar({ pool, color, now, }) {
    const restores = new Map(pool.resets.map((reset) => [reset.member.account.key, reset]));
    return (_jsx("div", { className: "@container/pool min-w-0", children: _jsx("div", { className: "grid gap-x-1 gap-y-1", style: { gridTemplateColumns: `repeat(${pool.columns.length}, minmax(0, 1fr))` }, children: pool.columns.map((member, position) => member.window ? (_jsx(PoolSegment, { account: member.account, window: member.window, reset: restores.get(member.account.key), refillPercent: member.refillPercent, color: normalizeProviderAccentColor(member.account.accentColor) ?? color, now: now, index: position + 1, showAccountName: pool.columns.length > 1 }, member.account.key)) : pool.kind === "monthly" && member.account.limits.zeroSpendCap ? (_jsxs("div", { style: { gridColumn: position + 1, gridRow: 1 }, className: "flex h-5 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border border-dashed border-border text-3xs whitespace-nowrap text-muted-foreground @2xl/pool:h-8 @2xl/pool:justify-start @2xl/pool:px-2 @2xl/pool:text-xs", children: [_jsx(AccountName, { account: member.account, className: "hidden min-w-0 truncate @2xl/pool:inline-flex" }), "$0 cap"] }, member.account.key)) : null) }) }));
}
function PoolWindowCard({ pool, color, now, label, description, }) {
    const nextRefill = pool.resets.find((reset) => reset.restoresPercent > 0);
    return (_jsxs("div", { className: "grid items-center gap-x-6 gap-y-3 rounded-lg border border-border/60 p-4 md:grid-cols-[11rem_minmax(0,1fr)]", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [label !== null ? (_jsx("span", { className: "text-sm font-medium text-foreground", children: label ?? pool.label })) : null, _jsxs("span", { className: "flex items-baseline gap-2", children: [_jsxs("span", { className: "text-3xl font-semibold text-foreground tabular-nums", children: [pool.remainingPercent, "%"] }), _jsxs("span", { className: "inline-flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx("span", { children: "left" }), pool.pace ? _jsx(PaceIcon, { pace: pool.pace }) : null] })] }), nextRefill && pool.columns.length > 1 ? (_jsxs("span", { className: "text-xs font-medium text-foreground tabular-nums", children: ["\u21BB +", nextRefill.restoresPercent, "%"] })) : null] }), _jsx(PoolBar, { pool: pool, color: color, now: now }), description ? (_jsx("p", { className: "text-xs text-muted-foreground md:col-span-2", children: description })) : null] }));
}
function PoolSection({ pool, now }) {
    const color = barColor(pool.driver);
    const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
    const windows = displayLimitWindows(pool);
    return (_jsxs("section", { className: "flex flex-col gap-3", children: [_jsxs("h2", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [_jsx(ProviderInstanceIcon, { driverKind: pool.driver, displayName: label, indicatorBackground: "var(--background)", className: "size-5", iconClassName: "size-4 text-foreground/80" }), label] }), windows.map((window) => {
                const details = pool.driver === "cursor" ? cursorUsageWindowDetails(window.id, pool) : undefined;
                return (_jsx(PoolWindowCard, { pool: window, color: color, now: now, label: details?.label, description: details?.description }, `${window.kind}:${window.id}`));
            })] }));
}
export function UsageLimitsPooled({ presentations, now, }) {
    const [segmentPopover] = useState(() => PopoverCreateHandle());
    const segmentPopoverActions = useRef(null);
    const pools = collectLimitPools(collectLimitAccounts(presentations), now);
    const notices = collectLimitNotices(presentations);
    const externalLinks = collectExternalUsageLinks(presentations);
    return (_jsxs("div", { className: "flex flex-col gap-8", children: [pools.length === 0 && notices.length === 0 && externalLinks.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No provider on the selected environments reports subscription limits." })) : null, _jsx(SegmentPopoverContext, { value: segmentPopover, children: pools.map((pool) => (_jsx(Fragment, { children: _jsx(PoolSection, { pool: pool, now: now }) }, pool.driver))) }), _jsx(Popover, { handle: segmentPopover, actionsRef: segmentPopoverActions, children: ({ payload }) => payload ? (_jsx(ActiveSegmentPopover, { handle: segmentPopover, actions: segmentPopoverActions, payload: payload, pools: pools, now: now })) : null }), externalLinks.map((link) => (_jsxs("section", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4", children: [_jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-3", children: [link.url === CHATGPT_USAGE_URL ? (_jsx(OpenAI, { className: "size-5 shrink-0", "aria-hidden": "true" })) : null, _jsxs("div", { className: "min-w-0 space-y-1", children: [_jsx("h2", { className: "text-sm font-medium", children: link.label }), _jsx("p", { className: "text-xs break-words text-muted-foreground", children: link.accounts.join(", ") }), link.url === CHATGPT_USAGE_URL ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "View usage in ChatGPT with your connected account." })) : link.message ? (_jsx("p", { className: "max-w-xl text-xs text-muted-foreground", children: link.message })) : null] })] }), _jsxs(Button, { variant: "ghost-muted", size: "xs", onClick: () => void ensureLocalApi().shell.openExternal(link.url), children: ["Manage usage", _jsx(ExternalLinkIcon, { className: "size-3.5", "aria-hidden": "true" })] })] }, link.url))), _jsx(LimitNotices, { notices: notices })] }));
}
function LimitNotices({ notices }) {
    if (notices.length === 0)
        return null;
    return (_jsxs(Alert, { variant: "warning", controlAlignment: "first-line", children: [_jsx(AlertTriangleIcon, {}), notices.map((notice) => (_jsx(AlertTitle, { className: "break-words", children: notice }, notice)))] }));
}
//# sourceMappingURL=upstream-usage-limits-pooled.js.map