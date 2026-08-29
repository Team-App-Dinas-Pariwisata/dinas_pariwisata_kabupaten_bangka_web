/**
 * Compatibility export after migration from MySQL.
 * New code should import helpers from `@/lib/realtime-db` directly.
 */
export { firebaseRealtimeDatabase as db } from "@/lib/firebase-rtdb";
