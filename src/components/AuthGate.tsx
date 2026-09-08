import { FormEvent, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabaseConfigured } from '../lib/supabaseClient'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <div className="centered-page">Loading…</div>
  }

  if (session) {
    return <>{children}</>
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="centered-page">
      <div className="auth-card">
        <h1>LocalPro</h1>
        <p className="muted">
          Find and book trusted local service providers — starting with home cleaning. Or sign up
          as a provider to list your services and start taking bookings.
        </p>

        {!supabaseConfigured && (
          <p className="warning">
            Supabase isn't configured yet. Copy <code>.env.example</code> to{' '}
            <code>.env.local</code> and add your project URL + anon key.
          </p>
        )}

        {sent ? (
          <p className="success">
            Check <strong>{email}</strong> for a magic sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send magic link'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
