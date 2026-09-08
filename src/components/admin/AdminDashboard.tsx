import { useState } from 'react'
import type { Profile } from '../../types'
import { Header } from '../Header'
import { PendingProviders } from './PendingProviders'
import { AllBookings } from './AllBookings'
import { PlatformStats } from './PlatformStats'

const TABS = ['Providers', 'Bookings', 'Stats'] as const

export function AdminDashboard({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Providers')

  return (
    <div className="app-shell">
      <Header
        title="LocalPro Admin"
        subtitle={profile.full_name}
        onSignOut={onSignOut}
        nav={
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </nav>
        }
      />
      {tab === 'Providers' && <PendingProviders />}
      {tab === 'Bookings' && <AllBookings />}
      {tab === 'Stats' && <PlatformStats />}
    </div>
  )
}
