import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type TableauDeBord } from '../../api'
import { ErrorMessage } from '../../shared/ui'
import { messageOf } from '../../shared/format'
import { BackOfficeLayout } from '../../layouts/BackOfficeLayout'
import { useAuth } from '../../auth-context'

export function StaffDashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<TableauDeBord | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get<TableauDeBord>('/tableau-de-bord')
      .then(setDashboard)
      .catch((cause: unknown) => setError(messageOf(cause)))
  }, [])

  return (
    <BackOfficeLayout>
      <section className="content-page staff-page">
        <span className="eyebrow">Maison H+ · Espace équipe</span>
        <h1>Bonjour,<br /><em>l’équipe.</em></h1>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="dashboard-grid">
          {[
            ['Réservations', dashboard?.reservations.total],
            ['À confirmer', dashboard?.reservations.enAttente],
            ['En séjour', dashboard?.reservations.enCours],
            ['Chambres occupées', dashboard?.occupation.chambresOccupees],
          ].map(([label, value]) => <div className="metric-card" key={label}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}
        </div>
        <div className="occupancy-card"><div><span className="eyebrow">Aujourd’hui · {dashboard?.occupation.date ?? '—'}</span><h2>Le rythme de la maison</h2><p>{dashboard?.occupation.chambresOccupees ?? '—'} chambres occupées sur {dashboard?.occupation.chambresOperationnelles ?? '—'} disponibles</p></div><div className="occupancy-value">{dashboard?.occupation.tauxPourcent ?? '—'}<span>%</span></div></div>
        <div className="staff-shortcuts">
          <Link to="/personnel/reservations">Gérer les réservations <span>↗</span></Link>
          <Link to="/personnel/clients">Consulter les clients <span>↗</span></Link>
          {user?.role === 'ADMINISTRATEUR' && <>
            <Link to="/personnel/chambres">Chambres et catégories <span>↗</span></Link>
            <Link to="/administration/utilisateurs">Gérer l’équipe <span>↗</span></Link>
          </>}
        </div>
      </section>
    </BackOfficeLayout>
  )
}
