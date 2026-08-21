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

/**
 * A stretch of days a doctor is unavailable.
 *
 * Stored separately from slots because leave covers time, not slots: booking a
 * fortnight off has to close the days nobody has opened yet as well as the ones
 * already on the calendar. Slot creation refuses dates inside a leave, and
 * taking leave clears the open slots already in the range.
 */
export interface Leave {
  id: string;
  doctorId: string;
  doctorName: string;
  /** YYYY-MM-DD, inclusive */
  from: string;
  /** YYYY-MM-DD, inclusive */
  to: string;
  reason?: string;
  createdAt: string;
}
