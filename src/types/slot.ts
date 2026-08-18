// Add this file, then add ONE line wherever your other types are
// re-exported from (e.g. `export * from "./slot";` in src/types/index.ts —
// or if @/types is a single file, just paste this block into it).

export type SlotStatus = "available" | "booked";

export interface Slot {
  id: string;
  doctorId: string;
  doctorName: string;
  /** Optional — leave unset to make the slot valid for any service under this doctor */
  service?: string;
  /** Whether the doctor sees patients for this slot in the clinic or over telemedicine.
   *  Optional only for slots created before this field existed — treat missing as "online". */
  mode?: "in-clinic" | "online";
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm, 24h */
  time: string;
  durationMinutes: number;
  status: SlotStatus;
  /** Set once a patient books this slot */
  appointmentId?: string;
  createdAt: string;
}
