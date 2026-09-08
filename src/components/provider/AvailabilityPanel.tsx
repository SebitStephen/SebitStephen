import { FormEvent, useState } from 'react'
import { useProviderAvailability } from '../../hooks/useProviderPortal'
import { WEEKDAYS } from '../../types'

export function AvailabilityPanel({ providerId }: { providerId: string }) {
  const { availability, loading, addWindow, removeWindow } = useProviderAvailability(providerId)
  const [weekday, setWeekday] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await addWindow({ weekday, start_time: `${startTime}:00`, end_time: `${endTime}:00` })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save availability')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Add working hours</h2>
        <form onSubmit={handleSubmit} className="subscription-form">
          <div className="form-row">
            <div>
              <label htmlFor="weekday">Day</label>
              <select id="weekday" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start">From</label>
              <input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label htmlFor="end">To</label>
              <input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add window'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Your weekly hours</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : availability.length === 0 ? (
          <p className="muted">No working hours set yet — customers can't book you until you add some.</p>
        ) : (
          <ul className="renewal-list">
            {availability.map((a) => (
              <li key={a.id} className="renewal-item">
                <span>
                  {WEEKDAYS[a.weekday]} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                </span>
                <button className="link danger" onClick={() => removeWindow(a.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
