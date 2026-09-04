import { getStorage } from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/client";

/**
 * The Firebase Storage client, in its own module, for the same reason `db` is
 * — see the note in client.ts.
 *
 * Nothing imported this when it was split out: `storage` was exported from
 * client.ts, shipped to every visitor, and used by nobody. It is kept because
 * file uploads are a feature this app has, and when something needs it, it
 * should import it from here rather than putting it back on the critical path.
 */
export const storage = getStorage(firebaseApp);
