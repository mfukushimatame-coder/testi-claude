// Local-timezone date helpers.
//
// Using `toISOString().split('T')[0]` returns a UTC date, which is up to
// 9 hours behind Japan time — records made before 09:00 JST would be saved
// with yesterday's date, breaking "today" totals and streaks. These helpers
// always use the device's local date instead.

/** Returns a YYYY-MM-DD key in the device's local timezone. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today's date as a YYYY-MM-DD key in local time. */
export function todayKey(): string {
  return localDateKey()
}

/** Returns a YYYY-MM local month key in the device's local timezone. */
export function localMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
