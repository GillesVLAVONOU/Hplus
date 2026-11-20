import type { ReactNode } from 'react'

export function ErrorMessage({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="notice notice-error" role="alert">{children}</p>
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    CONFIRMEE: 'Confirmée',
    EN_COURS: 'En cours',
    TERMINEE: 'Terminée',
    ANNULEE: 'Annulée',
  }
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status] ?? status}</span>
}
