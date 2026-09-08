import type { Availability } from '../types'

const SLOT_STEP_MINUTES = 30

export interface BusySlot {
  starts_at: string // ISO timestamp
  duration_minutes: number
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Builds bookable start times for the given date from the provider's
 * weekly availability windows, in 30-minute steps, dropping any slot that
 * would run past the window's end time or overlap an already-booked slot.
 */
export function getAvailableSlots(
  date: string, // "2026-09-15"
  durationMinutes: number,
  availability: Availability[],
  busy: BusySlot[],
): Date[] {
  const weekday = new Date(`${date}T00:00:00`).getDay()
  const windows = availability.filter((a) => a.weekday === weekday)
  if (windows.length === 0) return []

  const busyRanges = busy
    .filter((b) => b.starts_at.slice(0, 10) === date)
    .map((b) => {
      const start = toMinutes(b.starts_at.slice(11, 16))
      return { start, end: start + b.duration_minutes }
    })

  const slots: Date[] = []
  for (const window of windows) {
    const windowStart = toMinutes(window.start_time)
    const windowEnd = toMinutes(window.end_time)
    for (let start = windowStart; start + durationMinutes <= windowEnd; start += SLOT_STEP_MINUTES) {
      const end = start + durationMinutes
      const overlaps = busyRanges.some((b) => start < b.end && end > b.start)
      if (!overlaps) {
        const hh = String(Math.floor(start / 60)).padStart(2, '0')
        const mm = String(start % 60).padStart(2, '0')
        slots.push(new Date(`${date}T${hh}:${mm}:00`))
      }
    }
  }
  return slots
}
