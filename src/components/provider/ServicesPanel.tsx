import { FormEvent, useState } from 'react'
import { useProviderServices } from '../../hooks/useProviderPortal'
import { formatCurrency } from '../../utils/format'

const emptyForm = { title: '', description: '', price: 0, duration_minutes: 60 }

export function ServicesPanel({ providerId }: { providerId: string }) {
  const { services, loading, addService, deleteService } = useProviderServices(providerId)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await addService(form)
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save service')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>Add a service</h2>
        <form onSubmit={handleSubmit} className="subscription-form">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            required
            placeholder="e.g. Standard house cleaning"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="form-row">
            <div>
              <label htmlFor="price">Price (USD)</label>
              <input
                id="price"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                min={15}
                step="15"
                required
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
              />
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add service'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Your services</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : services.length === 0 ? (
          <p className="muted">Add your first service above so customers can book it.</p>
        ) : (
          <ul className="service-list">
            {services.map((s) => (
              <li key={s.id} className="service-row">
                <div>
                  <strong>{s.title}</strong>
                  <p className="muted small">{s.description || `${s.duration_minutes} min`}</p>
                </div>
                <div className="service-actions">
                  <span>{formatCurrency(s.price)}</span>
                  <button className="link danger" onClick={() => deleteService(s.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
