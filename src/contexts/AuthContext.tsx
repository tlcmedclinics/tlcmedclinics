"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { UserProfile } from "@/types";

/**
 * ── Why Firestore is imported inside the effect and not at the top ──
 *
 * This provider wraps every page, so a static `import ... from
 * "firebase/firestore"` here put the entire Firestore SDK into the bundle of
 * every route on the site — including the home page, where nobody is signed in
 * and no document is ever read. It was the largest single piece of JavaScript
 * a first-time visitor downloaded and parsed, and on a phone that is most of
 * the difference between the desktop and mobile PageSpeed scores.
 *
 * A dynamic import inside the effect below moves it to the only moment it is
 * needed: after Firebase has confirmed there IS a signed-in user. A visitor who
 * never signs in never downloads it. Someone who does signs in pays for it once,
 * a few hundred milliseconds after the page is already usable.
 *
 * The `cancelled` flag matters because the import is asynchronous and the user
 * can change — or the provider unmount — while it is still in flight. Without
 * it, a listener would be attached after cleanup had already run and would go
 * on writing state for a user who has signed out.
 */

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let unsubDoc: (() => void) | undefined;

    (async () => {
      const [{ doc, onSnapshot }, { db }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/db"),
      ]);
      if (cancelled) return;

      unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        setLoading(false);
      });
    })().catch((err) => {
      // The profile listener failing must not leave the app stuck on a
      // spinner: the user IS signed in, we simply could not read their
      // profile document. Let the UI proceed with `profile` null.
      console.error("[AuthContext] profile listener", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubDoc?.();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
