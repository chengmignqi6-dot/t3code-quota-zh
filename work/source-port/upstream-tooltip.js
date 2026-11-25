import { jsx as _jsx } from "react/jsx-runtime";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { createContext, use, useEffect, useRef, useState, } from "react";
import { cn } from "~/lib/utils";
import { useNativeTitlebarHeight } from "~/lib/windowControlsOverlay";
// Base UI's default, restated because a padding object zeroes the sides it omits.
const COLLISION_PADDING = 5;
const TooltipProvider = TooltipPrimitive.Provider;
// The compiler freezes context values; update hovered tooltips through calls instead of shared ref writes.
function createTooltipHoverTracker() {
    let hovered = null;
    return {
        hover(trigger, actionsRef) {
            hovered = { trigger, actionsRef };
        },
        release(actionsRef) {
            if (hovered?.actionsRef === actionsRef)
                hovered = null;
        },
        dismissUnfocused() {
            const tooltip = hovered;
            if (!tooltip)
                return;
            const focused = tooltip.trigger.ownerDocument.activeElement;
            if (focused && tooltip.trigger.contains(focused) && focused.matches(":focus-visible")) {
                return;
            }
            hovered = null;
            // Base UI also cancels delayed hover opens through this action.
            tooltip.actionsRef.current?.close();
        },
    };
}
const TooltipHoverContext = createContext(null);
const TooltipScrollContext = createContext(null);
function TooltipScrollDismissArea({ onScrollCapture, ...props }) {
    const [tracker] = useState(createTooltipHoverTracker);
    return (_jsx(TooltipScrollContext, { value: tracker, children: _jsx("div", { ...props, onScrollCapture: (event) => {
                onScrollCapture?.(event);
                tracker.dismissUnfocused();
            } }) }));
}
function Tooltip(props) {
    const tracker = use(TooltipScrollContext);
    const localActionsRef = useRef(null);
    const actionsRef = props.actionsRef ?? localActionsRef;
    // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- releases this tooltip from the scroll tracker on unmount
    useEffect(() => () => tracker?.release(actionsRef), [actionsRef, tracker]);
    if (!tracker)
        return _jsx(TooltipPrimitive.Root, { ...props });
    return (_jsx(TooltipHoverContext, { value: actionsRef, children: _jsx(TooltipPrimitive.Root, { ...props, actionsRef: actionsRef, onOpenChange: (open, details) => {
                props.onOpenChange?.(open, details);
                if (!open && !details.isCanceled)
                    tracker.release(actionsRef);
            } }) }));
}
function TooltipTrigger(props) {
    const tracker = use(TooltipScrollContext);
    const actionsRef = use(TooltipHoverContext);
    if (!tracker || !actionsRef) {
        return _jsx(TooltipPrimitive.Trigger, { "data-slot": "tooltip-trigger", ...props });
    }
    return (_jsx(TooltipPrimitive.Trigger, { "data-slot": "tooltip-trigger", ...props, onMouseEnter: (event) => {
            props.onMouseEnter?.(event);
            tracker.hover(event.currentTarget, actionsRef);
        } }));
}
function TooltipPositioner(props) {
    const titlebarHeight = useNativeTitlebarHeight();
    return (_jsx(TooltipPrimitive.Positioner, { className: "pointer-events-none z-[140] max-w-(--available-width) transition-[top,left,right,bottom,transform] data-instant:transition-none", collisionPadding: {
            top: COLLISION_PADDING + titlebarHeight,
            right: COLLISION_PADDING,
            bottom: COLLISION_PADDING,
            left: COLLISION_PADDING,
        }, "data-slot": "tooltip-positioner", ...props }));
}
function TooltipPopup({ className, align = "center", sideOffset = 4, side = "top", variant = "default", anchor, children, ...props }) {
    return (_jsx(TooltipPrimitive.Portal, { children: _jsx(TooltipPositioner, { align: align, anchor: anchor, side: side, sideOffset: sideOffset, children: _jsx(TooltipPrimitive.Popup, { className: cn("relative flex origin-(--transform-origin) rounded-md text-popover-foreground text-xs transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-md)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 data-instant:duration-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]", variant === "glass"
                    ? "dropdown-glass shadow-xl shadow-black/25 before:hidden"
                    : "border bg-popover not-dark:bg-clip-padding shadow-md/5", variant === "code"
                    ? "max-w-120 wrap-anywhere text-left font-mono text-[11px] leading-relaxed"
                    : "max-w-80 wrap-anywhere whitespace-normal leading-snug", className), "data-slot": "tooltip-popup", ...props, children: _jsx("div", { className: "min-w-0 px-2 py-1", "data-slot": "tooltip-viewport", children: children }) }) }) }));
}
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipPopup, TooltipScrollDismissArea };
//# sourceMappingURL=upstream-tooltip.js.map