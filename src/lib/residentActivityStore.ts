import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { buildDailySummary, type CompanionSession } from "./residentCompanion";
import type { ResidentPreference } from "./residentPersonalisation";

export type SyncState = "synced" | "local" | "offline";

export async function persistResidentSession(session: CompanionSession, preference?: ResidentPreference): Promise<SyncState> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";
  if (!db || !auth?.currentUser) return "local";
  const summary = buildDailySummary(session);
  try {
    await Promise.all([
      setDoc(doc(db, "residentActivitySessions", session.id), {
        residentId: session.residentId,
        startedAt: session.startedAt,
        activities: session.activities,
        messageCount: session.messages.length,
        updatedAt: serverTimestamp()
      }, { merge: true }),
      setDoc(doc(db, "residentDailySummaries", `${session.residentId}_${summary.date}`), {
        ...summary,
        updatedAt: serverTimestamp()
      }, { merge: true }),
      ...(preference ? [setDoc(doc(db, "residentPreferences", preference.residentId), { ...preference, updatedAt: serverTimestamp() }, { merge: true }), ...preference.savedMemories.map(memory => setDoc(doc(db, "residentMemoryJournals", memory.id), { ...memory, residentId: preference.residentId, updatedAt: serverTimestamp() }, { merge: true }))] : [])
    ]);
    return "synced";
  } catch (error) {
    console.warn("Resident activity retained locally; Firestore sync failed.", error);
    return "local";
  }
}
