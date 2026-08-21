"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * One confirmation dialog for the whole app.
 *
 * It replaces `window.confirm`, which the panels used for deleting a service,
 * freeing a slot, cancelling an appointment and so on. That browser dialog is
 * unstyled, differs on every platform, cannot say which slot or which patient
 * in anything but plain text, and looks enough like a browser warning that
 * people click it without reading. It also blocks the whole page while open.
 *
 * The API is deliberately shaped like the thing it replaces, so a call site
 * reads almost the same:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete this service?" }))) return;
 *
 * `destructive` turns the action button red. Used for anything that removes
 * something or takes money — a colour is the one part of a dialog people
 * reliably notice before clicking.
 */

export type ConfirmOptions = {
  title: string;
  /** The consequence, in one line. What actually happens, not "are you sure?". */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  // Held in a ref, not state: this is the other half of the promise handed to
  // the caller, and it must survive re-renders untouched.
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const confirmButton = useRef<HTMLButtonElement | null>(null);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((next) => {
    // A second dialog while one is open would strand the first caller waiting
    // on a promise nobody will ever settle. Close the first as a cancel.
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  // Escape cancels, as it does in every other dialog. Bound while open only.
  useEffect(() => {
    if (!options) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") settle(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, settle]);

  // Focus the action button when it opens, so the keyboard is already inside
  // the dialog rather than still on the page behind it.
  useEffect(() => {
    if (options) confirmButton.current?.focus();
  }, [options]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center"
          // Clicking the backdrop cancels. The check keeps a click that
          // started inside the panel from counting as one.
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) settle(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-sm rounded-2xl border border-line bg-paper p-5 shadow-xl"
          >
            <h2 id="confirm-title" className="text-base font-semibold text-ink">
              {options.title}
            </h2>

            {options.message && (
              <p className="mt-2 text-sm text-ink-soft">{options.message}</p>
            )}

            {/* Cancel first in the DOM so tabbing lands on the safe option,
                but placed to the left visually where people expect it. */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => settle(false)}
                className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmButton}
                onClick={() => settle(true)}
                className={`rounded-full px-4 py-2 text-xs font-medium text-white transition-colors ${
                  options.destructive
                    ? "bg-crimson hover:bg-crimson-deep"
                    : "bg-indigo hover:bg-indigo-deep"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
