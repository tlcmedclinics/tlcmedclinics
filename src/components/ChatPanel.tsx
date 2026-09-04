"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import Overlay from "@/components/Overlay";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { playMessageReceivedTone, playMessageSentTone } from "@/lib/notification-sound";
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

type Props = {
  threadId: string;
  viewerUid: string;
  viewerRole: UserRole;
  hostView?: boolean;
  patientName: string;
  onClose: () => void;
};

/** Only load the tail of a long consultation; older messages aren't needed. */
const MESSAGE_LIMIT = 200;

/**
 * How close to the bottom still counts as "reading the latest". If the user
 * has scrolled further up than this to re-read something, an incoming message
 * must not yank them back down.
 */
const STICK_THRESHOLD_PX = 120;

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
  const { profile } = useAuth();

  const [key, setKey] = useState<CryptoKey | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether the view is currently pinned to the newest message.
  const stickToBottom = useRef(true);

  const soundOn = profile?.messageSound !== false;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    // Setting scrollTop moves only this container. `scrollIntoView` walks up
    // and scrolls every scrollable ancestor too, which is how an incoming
    // message used to drag the whole page down.
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceFromBottom <= STICK_THRESHOLD_PX;
    setShowJumpToLatest(!stickToBottom.current);
  }

  // 1. Fetch this thread's decryption key once — the server only hands it out
  // if the caller is a genuine participant of this appointment.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`/api/chat/${threadId}/key`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("chat.loadError"));
        if (cancelled) return;
        setKey(await importThreadKey(data.key));
      } catch (err) {
        if (!cancelled) {
          setKeyError(err instanceof Error ? err.message : t("chat.loadError"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // 2. Live-subscribe to ciphertext messages.
  useEffect(() => {
    const q = query(
      collection(db, "chatThreads", threadId, "messages"),
      orderBy("createdAt", "asc"),
      limitToLast(MESSAGE_LIMIT)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setRawMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RawMessage))),
      () => toast.error(t("chat.loadError"))
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // 3. Decrypt anything new once the key is available.
  useEffect(() => {
    if (!key) return;
    const pending = rawMessages.filter((m) => !(m.id in decrypted));
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      // Decrypt in parallel — a long thread opening one message at a time was
      // noticeably slow on a phone.
      const entries = await Promise.all(
        pending.map(async (m) => [m.id, await decryptChatText(key, m.cipherText, m.iv)] as const)
      );
      if (!cancelled) setDecrypted((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    return () => {
      cancelled = true;
    };
  }, [key, rawMessages, decrypted]);

  // 4. Keep the newest message in view, and sound the arrival.
  //
  // The very first snapshot is the existing history, so it neither scrolls
  // smoothly nor plays a tone — otherwise opening a busy thread would chirp.
  const lastSoundedId = useRef<string | null>(null);
  const seededHistory = useRef(false);

  useEffect(() => {
    if (!rawMessages.length) return;
    const latest = rawMessages[rawMessages.length - 1];
    const isMine = latest.senderId === viewerUid;
    const firstLoad = !seededHistory.current;

    if (firstLoad) {
      seededHistory.current = true;
      lastSoundedId.current = latest.id;
      scrollToBottom("auto");
      return;
    }

    // Your own message always scrolls into view; someone else's only does when
    // you haven't scrolled up to re-read something.
    if (isMine || stickToBottom.current) {
      scrollToBottom("smooth");
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }

    if (soundOn && lastSoundedId.current !== latest.id) {
      lastSoundedId.current = latest.id;
      if (!isMine) playMessageReceivedTone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMessages.length]);

  const messages = useMemo(
    () => rawMessages.map((m) => ({ ...m, text: decrypted[m.id] ?? "…" })),
    [rawMessages, decrypted]
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !key || sending) return;
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
      stickToBottom.current = true;
      if (soundOn) playMessageSentTone();
    } catch {
      toast.error(t("chat.sendError"));
    } finally {
      setSending(false);
    }
  }

  const title = hostView ? patientName : t("chat.consultation");

  return (
    <Overlay onClose={onClose} className="items-stretch justify-center bg-ink/50 sm:p-4">
      {/*
        The panel is a fixed-height flex column: header and composer never
        move, and only the message list scrolls. `min-h-0` on the scroller is
        what actually lets a flex child shrink instead of pushing the composer
        off the bottom of the screen.
      */}
      <div className="flex h-full w-full flex-col overflow-hidden bg-paper sm:mx-auto sm:my-auto sm:h-[min(46rem,90dvh)] sm:max-w-md sm:rounded-[var(--radius-lg)] sm:shadow-[var(--shadow-pop)]">
        <header
          className={`flex shrink-0 items-center justify-between gap-2 px-4 py-3 ${
            hostView ? "bg-indigo-deep text-paper" : "bg-indigo text-paper"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
              {title.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{title}</p>
              <p className="flex items-center gap-1 text-[0.65rem] text-paper/80">
                🔒 {t("chat.encrypted")}
                {hostView && <span>· {t("chat.hostView")}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full border border-paper/30 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-paper/10"
          >
            {t("common.close")}
          </button>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            // `overscroll-contain` stops a flick at the top or bottom of the
            // thread from chaining into the page behind the overlay.
            className="shell-scroll h-full space-y-2.5 overflow-y-auto overscroll-contain bg-mist/30 px-3 py-4 sm:px-4"
          >
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
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      mine
                        ? "rounded-br-sm bg-indigo text-white"
                        : "rounded-bl-sm bg-paper text-ink"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {showJumpToLatest && (
            <button
              type="button"
              onClick={() => {
                stickToBottom.current = true;
                setShowJumpToLatest(false);
                scrollToBottom("smooth");
              }}
              className="absolute bottom-3 end-3 rounded-full bg-indigo px-3.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-pop)]"
            >
              {t("chat.jumpToLatest")} ↓
            </button>
          )}
        </div>

        <form
          onSubmit={send}
          className="safe-bottom flex shrink-0 items-center gap-2 border-t border-line/70 bg-paper px-3 py-2.5 sm:px-4"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("chat.placeholder")}
            disabled={!key}
            autoComplete="off"
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={sending || !text.trim() || !key}
            className="btn-indigo btn-sm shrink-0"
          >
            {t("common.send")}
          </button>
        </form>
      </div>
    </Overlay>
  );
}
