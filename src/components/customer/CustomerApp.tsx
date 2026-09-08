import { useState } from 'react'
import type { Profile } from '../../types'
import { Header } from '../Header'
import { ProviderList } from './ProviderList'
import { MyBookings } from './MyBookings'

const TABS = ['browse', 'bookings'] as const

export function CustomerApp({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('browse')

  return (
    <div className="app-shell">
      <Header
        title="LocalPro"
        subtitle={`Hi ${profile.full_name || 'there'}${profile.city ? ` · ${profile.city}` : ''}`}
        onSignOut={onSignOut}
        nav={
          <nav className="tabs">
            <button className={tab === 'browse' ? 'tab active' : 'tab'} onClick={() => setTab('browse')}>
              Browse
            </button>
            <button className={tab === 'bookings' ? 'tab active' : 'tab'} onClick={() => setTab('bookings')}>
              My bookings
            </button>
          </nav>
        }
      />
      {tab === 'browse' ? (
        <ProviderList defaultCity={profile.city ?? ''} customerId={profile.id} />
      ) : (
        <MyBookings customerId={profile.id} />
      )}
    </div>
  )
}
