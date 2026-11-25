import { minuteTick } from "@t3tools/client-runtime/clock";
import { useSyncExternalStore } from "react";
export function useNowMinute() {
    return useSyncExternalStore(minuteTick.subscribe, minuteTick.getSnapshot, minuteTick.getSnapshot);
}
//# sourceMappingURL=upstream-now-minute.js.map