import { AuthGate } from './components/AuthGate'
import { Dashboard } from './components/Dashboard'
import { useAuth } from './hooks/useAuth'

function AppContent() {
  const { user, signOut } = useAuth()
  if (!user) return null
  return <Dashboard user={user} onSignOut={signOut} />
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  )
}
