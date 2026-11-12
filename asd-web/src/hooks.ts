import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Message } from "./api/types";

/**
 * Loads a session's messages and streams agent turns in real time. Returns the
 * accumulated streaming text per message id so the UI can render deltas as they
 * arrive, then reconcile on `message.done`.
 */
export function useMessages(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streams, setStreams] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const msgs = await api.messages(sessionId);
    setMessages(msgs);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    return api.realtime.subscribe("session", sessionId, (e) => {
      if (e.type === "message.delta") {
        setStreams((s) => ({ ...s, [e.data.messageId]: (s[e.data.messageId] ?? "") + e.data.delta }));
      } else if (e.type === "message.done") {
        setStreams((s) => {
          const next = { ...s };
          delete next[e.data.messageId];
          return next;
        });
        void load();
      } else if (e.type === "approval.created" || e.type === "approval.updated") {
        void load();
      }
    });
  }, [sessionId, load]);

  const send = useCallback(
    async (body: string) => {
      if (!body.trim()) return;
      setSending(true);
      try {
        await api.sendMessage(sessionId, body.trim());
        await load();
      } finally {
        setSending(false);
      }
    },
    [sessionId, load],
  );

  return { messages, loading, sending, streams, send, reload: load };
}
