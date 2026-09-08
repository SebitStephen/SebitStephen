import type { ReactNode } from 'react'

export function Header({
  title,
  subtitle,
  onSignOut,
  nav,
}: {
  title: string
  subtitle: string
  onSignOut: () => void
  nav?: ReactNode
}) {
  return (
    <header className="app-header">
      <div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      {nav}
      <button className="secondary" onClick={onSignOut}>
        Sign out
      </button>
    </header>
  )
}
