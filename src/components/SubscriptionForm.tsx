import { FormEvent, useState } from 'react'
import type { Subscription, SubscriptionInput } from '../types'
import { BILLING_CYCLES, CATEGORIES } from '../types'

const emptyForm: SubscriptionInput = {
  name: '',
  category: 'other',
  cost: 0,
  billing_cycle: 'monthly',
  renewal_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export function SubscriptionForm({
  editing,
  onSubmit,
  onCancel,
}: {
  editing: Subscription | null
  onSubmit: (input: SubscriptionInput) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<SubscriptionInput>(
    editing
      ? {
          name: editing.name,
          category: editing.category,
          cost: editing.cost,
          billing_cycle: editing.billing_cycle,
          renewal_date: editing.renewal_date,
          notes: editing.notes ?? '',
        }
      : emptyForm,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save subscription')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="subscription-form">
      <h2>{editing ? 'Edit subscription' : 'Add a subscription'}</h2>

      <label htmlFor="name">Name</label>
      <input
        id="name"
        required
        placeholder="e.g. ChatGPT Plus"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <div className="form-row">
        <div>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as SubscriptionInput['category'] })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="billing_cycle">Billing cycle</label>
          <select
            id="billing_cycle"
            value={form.billing_cycle}
            onChange={(e) =>
              setForm({ ...form, billing_cycle: e.target.value as SubscriptionInput['billing_cycle'] })
            }
          >
            {BILLING_CYCLES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div>
          <label htmlFor="cost">Cost (USD)</label>
          <input
            id="cost"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
          />
        </div>

        <div>
          <label htmlFor="renewal_date">Next renewal date</label>
          <input
            id="renewal_date"
            type="date"
            required
            value={form.renewal_date}
            onChange={(e) => setForm({ ...form, renewal_date: e.target.value })}
          />
        </div>
      </div>

      <label htmlFor="notes">Notes (optional)</label>
      <textarea
        id="notes"
        placeholder="What do you use this for?"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add subscription'}
        </button>
      </div>
    </form>
  )
}
