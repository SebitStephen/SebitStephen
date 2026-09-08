import { FormEvent, useState } from 'react'
import type { Role } from '../types'

export function RoleSetup({
  onComplete,
}: {
  onComplete: (input: { full_name: string; city: string; role: Role }) => Promise<void>
}) {
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [role, setRole] = useState<Role>('customer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onComplete({ full_name: fullName, city, role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="centered-page">
      <div className="auth-card">
        <h1>Welcome to LocalPro</h1>
        <p className="muted">Tell us a bit about you to get started.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="full_name">{role === 'provider' ? 'Business or your name' : 'Your name'}</label>
          <input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label htmlFor="city">City</label>
          <input
            id="city"
            required
            placeholder="e.g. Austin, TX"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <label>I want to...</label>
          <div className="role-toggle">
            <button
              type="button"
              className={role === 'customer' ? 'toggle active' : 'toggle'}
              onClick={() => setRole('customer')}
            >
              🔍 Find a service
            </button>
            <button
              type="button"
              className={role === 'provider' ? 'toggle active' : 'toggle'}
              onClick={() => setRole('provider')}
            >
              🧹 Offer a service
            </button>
          </div>

          {role === 'provider' && (
            <p className="muted small">
              Home Cleaning is the only live category at launch. Your profile stays hidden from
              customers until an admin approves it.
            </p>
          )}

          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
