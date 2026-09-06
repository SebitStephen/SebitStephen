import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { Header } from './Header'
import { SpendSummary } from './SpendSummary'
import { RenewalsList } from './RenewalsList'
import { CategoryOverlap } from './CategoryOverlap'
import { SubscriptionForm } from './SubscriptionForm'
import { SubscriptionTable } from './SubscriptionTable'
import type { Subscription, SubscriptionInput } from '../types'

export function Dashboard({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const {
    subscriptions,
    loading,
    error,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleStatus,
    markUsedToday,
  } = useSubscriptions(user.id)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  async function handleSubmit(input: SubscriptionInput) {
    if (editing) {
      await updateSubscription(editing.id, input)
    } else {
      await addSubscription(input)
    }
    setShowForm(false)
    setEditing(null)
  }

  function handleEdit(sub: Subscription) {
    setEditing(sub)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (confirm('Delete this subscription? This cannot be undone.')) {
      deleteSubscription(id)
    }
  }

  return (
    <div className="app-shell">
      <Header user={user} onSignOut={onSignOut} />

      <SpendSummary subscriptions={subscriptions} />

      <div className="two-column">
        <RenewalsList subscriptions={subscriptions} />
        <CategoryOverlap subscriptions={subscriptions} />
      </div>

      {error && <p className="error">{error}</p>}

      {showForm ? (
        <section className="panel">
          <SubscriptionForm
            editing={editing}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditing(null)
            }}
          />
        </section>
      ) : (
        <button
          className="add-button"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
        >
          + Add subscription
        </button>
      )}

      {loading ? (
        <p className="muted">Loading subscriptions…</p>
      ) : (
        <SubscriptionTable
          subscriptions={subscriptions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkUsed={markUsedToday}
          onToggleStatus={toggleStatus}
        />
      )}
    </div>
  )
}
