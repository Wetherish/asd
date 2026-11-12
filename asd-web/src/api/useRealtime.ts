import { useEffect, useRef } from "react";
import type { RealtimeEvent, Scope } from "./types";
import { api } from "./instance";

/**
 * Subscribes to the realtime stream for a scope + id, invoking `handler` for
 * each matching event. Auto-unsubscribes on unmount and re-subscribes when
 * scope/id change. `handler` is read from a ref so it need not be memoized.
 */
export function useRealtime(scope: Scope, id: string | null, handler: (e: RealtimeEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!id) return;
    return api.realtime.subscribe(scope, id, (e) => handlerRef.current(e));
  }, [scope, id]);
}
