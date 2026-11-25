import { useSyncExternalStore } from "react";
import { isElectron } from "~/env";
import { isMacPlatform, isWindowsPlatform } from "./utils";
const WCO_CLASS_NAME = "wco";
const ELECTRON_CLASS_NAME = "electron";
const ELECTRON_WINDOWS_CLASS_NAME = "electron-windows";
// macOS has no overlay API; traffic lights stay inside this topbar at every zoom level.
const MACOS_TITLEBAR_HEIGHT = 52;
function getWindowControlsOverlay() {
    if (typeof navigator === "undefined") {
        return null;
    }
    return navigator.windowControlsOverlay ?? null;
}
/** Height of the native caption strip drawn over the page, or 0 when the window has none. */
export function windowControlsOverlayHeight() {
    const overlay = getWindowControlsOverlay();
    return overlay?.visible ? overlay.getTitlebarAreaRect().height : 0;
}
export function onWindowControlsOverlayGeometryChange(listener) {
    const overlay = getWindowControlsOverlay();
    if (!overlay) {
        return () => { };
    }
    overlay.addEventListener("geometrychange", listener);
    return () => {
        overlay.removeEventListener("geometrychange", listener);
    };
}
export function syncDocumentWindowControlsOverlayClass() {
    if (typeof document === "undefined") {
        return () => { };
    }
    const overlay = getWindowControlsOverlay();
    const update = () => {
        document.documentElement.classList.toggle(WCO_CLASS_NAME, overlay !== null && overlay.visible);
    };
    update();
    return onWindowControlsOverlayGeometryChange(update);
}
function subscribeTitlebarArea(listener) {
    const overlay = getWindowControlsOverlay();
    overlay?.addEventListener("geometrychange", listener);
    return () => overlay?.removeEventListener("geometrychange", listener);
}
function getNativeTitlebarHeight() {
    if (isElectron && isMacPlatform(navigator.platform))
        return MACOS_TITLEBAR_HEIGHT;
    const overlay = getWindowControlsOverlay();
    return overlay?.visible ? overlay.getTitlebarAreaRect().bottom : 0;
}
export function useNativeTitlebarHeight() {
    return useSyncExternalStore(subscribeTitlebarArea, getNativeTitlebarHeight, () => 0);
}
function getElectronPlatformClassNames(platform) {
    return isWindowsPlatform(platform)
        ? [ELECTRON_CLASS_NAME, ELECTRON_WINDOWS_CLASS_NAME]
        : [ELECTRON_CLASS_NAME];
}
export function syncDocumentElectronPlatformClasses(platform) {
    if (typeof document === "undefined") {
        return () => { };
    }
    const classNames = getElectronPlatformClassNames(platform);
    document.documentElement.classList.add(...classNames);
    return () => {
        document.documentElement.classList.remove(...classNames);
    };
}
//# sourceMappingURL=upstream-window-controls.js.map