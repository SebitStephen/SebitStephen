import { AuthGate } from './components/AuthGate'
import { RoleSetup } from './components/RoleSetup'
import { CustomerApp } from './components/customer/CustomerApp'
import { ProviderDashboard } from './components/provider/ProviderDashboard'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'

function AppContent() {
  const { user, signOut } = useAuth()
  const { profile, loading, completeOnboarding } = useProfile(user?.id)

  if (!user || loading) return <div className="centered-page">Loading…</div>

  // full_name is blank until onboarding runs (see handle_new_user()), so
  // it doubles as the "has this user set up their account yet" flag.
  if (!profile || profile.full_name === '') {
    return <RoleSetup onComplete={completeOnboarding} />
  }

  if (profile.role === 'admin') return <AdminDashboard profile={profile} onSignOut={signOut} />
  if (profile.role === 'provider') return <ProviderDashboard profile={profile} onSignOut={signOut} />
  return <CustomerApp profile={profile} onSignOut={signOut} />
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  )
}
