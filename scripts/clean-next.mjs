/**
 * Deletes .next before every build. npm runs this automatically as `prebuild`.
 *
 * Hostinger builds inside a directory it keeps between deploys, so a .next left
 * behind by a *failed* build is still there for the next one. That directory
 * holds the client reference manifest, and half of one is worse than none: the
 * build reuses it, the entries it needs aren't in it, and the failure points at
 * whichever component happens to be missing rather than at the stale cache.
 *
 * Written in Node rather than `rm -rf .next` so it also works from a Windows
 * command prompt — npm scripts run through cmd.exe there, where rm doesn't
 * exist.
 *
 * `force: true` means an absent .next is not an error, which is the normal case
 * on a fresh clone.
 */

import { rmSync } from "node:fs";

rmSync(".next", { recursive: true, force: true });
console.log("[prebuild] .next removed — building from clean");
