import type { User } from '@supabase/supabase-js'

export function Header({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <header className="app-header">
      <div>
        <h1>AI Subscription Tracker</h1>
        <p className="muted">{user.email}</p>
      </div>
      <button className="secondary" onClick={onSignOut}>
        Sign out
      </button>
    </header>
  )
}
