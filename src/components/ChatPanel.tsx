"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import {
  decryptChatText,
  encryptChatText,
  importThreadKey,
} from "@/lib/chat-crypto-client";
import type { UserRole } from "@/types";

type RawMessage = {
  id: string;
  senderId: string;
  senderRole: UserRole;
  cipherText: string;
  iv: string;
  createdAt?: { toDate: () => Date } | null;
};

type DisplayMessage = RawMessage & { text: string };

type Props = {
  threadId: string;
  viewerUid: string;
  viewerRole: UserRole;
  hostView?: boolean;
  patientName: string;
  onClose: () => void;
};

export default function ChatPanel({
  threadId,
  viewerUid,
  viewerRole,
  hostView,
  patientName,
  onClose,
}: Props) {
  const toast = useToast();
  const t = useT();
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Fetch this thread's decryption key once — the server only hands it
  // out if the caller is a genuine participant of this appointment.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`/api/chat/${threadId}/key`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't unlock this conversation");
        if (cancelled) return;
        setKey(await importThreadKey(data.key));
      } catch (err) {
        if (!cancelled) {
          setKeyError(err instanceof Error ? err.message : "Couldn't unlock this conversation");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // 2. Live-subscribe to ciphertext messages.
  useEffect(() => {
    const q = query(
      collection(db, "chatThreads", threadId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RawMessage)));
      },
      () => toast.error(t("chat.loadError"))
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // 3. Decrypt any new messages locally once we have the key.
  useEffect(() => {
    if (!key) return;
    const pending = rawMessages.filter((m) => !(m.id in decrypted));
    if (pending.length === 0) return;
    (async () => {
      const updates: Record<string, string> = {};
      for (const m of pending) {
        updates[m.id] = await decryptChatText(key, m.cipherText, m.iv);
      }
      setDecrypted((prev) => ({ ...prev, ...updates }));
    })();
  }, [key, rawMessages, decrypted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rawMessages.length]);

  const messages: DisplayMessage[] = rawMessages.map((m) => ({
    ...m,
    text: decrypted[m.id] ?? "…",
  }));

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || !key) return;
    setSending(true);
    try {
      const { cipherText, iv } = await encryptChatText(key, trimmed);
      await addDoc(collection(db, "chatThreads", threadId, "messages"), {
        senderId: viewerUid,
        senderRole: viewerRole,
        cipherText,
        iv,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch {
      toast.error(t("chat.sendError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-paper">
      <div
        className={`flex items-center justify-between px-4 py-3 sm:px-6 ${
          hostView ? "bg-indigo-deep text-paper" : "bg-indigo text-paper"
        }`}
      >
        <div className="flex items-center gap-2">
          {hostView && (
            <span className="rounded-full bg-paper/15 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider">
              {t("chat.hostView")}
            </span>
          )}
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-paper/90">
            🔒 {t("chat.encrypted")}
          </span>
          <p className="text-sm font-medium">
            {hostView ? `${t("chat.chatWith")} ${patientName}` : t("chat.consultation")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-paper/30 px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-paper/10"
        >
          {t("common.close")}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6 sm:px-6">
        {keyError && (
          <p className="mt-8 text-center text-sm text-crimson-deep">{keyError}</p>
        )}
        {!keyError && !key && (
          <p className="mt-8 text-center text-sm text-ink-soft">{t("chat.unlocking")}</p>
        )}
        {key && messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-ink-soft">{t("chat.empty")}</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === viewerUid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "bg-indigo text-white" : "bg-mist text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-3 border-t border-line/70 px-4 py-3 sm:px-6"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.placeholder")}
          disabled={!key}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={sending || !text.trim() || !key}
          className="rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
        >
          {t("common.send")}
        </button>
      </form>
    </div>
  );
}
