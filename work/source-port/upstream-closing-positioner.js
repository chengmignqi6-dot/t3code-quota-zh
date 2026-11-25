import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
const PLACEMENT_KEYS = ["position", "top", "right", "bottom", "left", "transform"];
function ClosingPositioner({ open, style, ...props }) {
    const [openPlacement, setOpenPlacement] = useState({});
    if (open && style && PLACEMENT_KEYS.some((key) => style[key] !== openPlacement[key])) {
        const { position, top, right, bottom, left, transform } = style;
        setOpenPlacement({ position, top, right, bottom, left, transform });
    }
    return _jsx("div", { ...props, style: open ? style : { ...style, ...openPlacement } });
}
export function renderClosingPositioner(props, state) {
    return _jsx(ClosingPositioner, { ...props, open: state.open });
}
//# sourceMappingURL=upstream-closing-positioner.js.map