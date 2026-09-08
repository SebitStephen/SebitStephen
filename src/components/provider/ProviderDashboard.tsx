import { useState } from 'react'
import type { Profile } from '../../types'
import { Header } from '../Header'
import { BookingsPanel } from './BookingsPanel'
import { ServicesPanel } from './ServicesPanel'
import { AvailabilityPanel } from './AvailabilityPanel'
import { EarningsPanel } from './EarningsPanel'

const TABS = ['Bookings', 'Services', 'Availability', 'Earnings'] as const

export function ProviderDashboard({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Bookings')

  return (
    <div className="app-shell">
      <Header
        title="LocalPro for Providers"
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
      {tab === 'Bookings' && <BookingsPanel providerId={profile.id} />}
      {tab === 'Services' && <ServicesPanel providerId={profile.id} />}
      {tab === 'Availability' && <AvailabilityPanel providerId={profile.id} />}
      {tab === 'Earnings' && <EarningsPanel providerId={profile.id} />}
    </div>
  )
}
