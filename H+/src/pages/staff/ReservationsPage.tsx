import { useEffect, useState } from 'react'
import { api, type Reservation, type StatutReservation } from '../../api'
import { ErrorMessage, StatusBadge } from '../../shared/ui'
import { dateLabel, messageOf, money } from '../../shared/format'
import { HotelIcon } from '../../icons'
import { BackOfficeLayout } from '../../layouts/BackOfficeLayout'

export function StaffReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = async () => {
    const { reservations: list } = await api.get<{ reservations: Reservation[] }>('/personnel/reservations?limite=100')
    setReservations(list)
  }
  useEffect(() => {
    void api.get<{ reservations: Reservation[] }>('/personnel/reservations?limite=100')
      .then(({ reservations: list }) => setReservations(list))
      .catch((cause: unknown) => setError(messageOf(cause)))
  }, [])

  async function updateStatus(id: number, statut: StatutReservation) {
    setBusyId(id)
    setError('')
    try {
      await api.patch(`/personnel/reservations/${id}/statut`, { statut })
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusyId(null)
    }
  }
  async function updateBooking(id: number, statut: StatutReservation) {
    return updateStatus(id, statut)
  }

  return (
    <BackOfficeLayout><section className="content-page staff-page">
      <span className="eyebrow">Espace équipe</span><h1>Les séjours<br /><em>en un regard.</em></h1>
      <ErrorMessage>{error}</ErrorMessage>
      {reservations.length === 0 ? <div className="empty-state"><HotelIcon /><h3>Aucune réservation pour le moment</h3></div> : (
        <div className="staff-booking-list">{reservations.map((item) => (
          <article className="staff-booking" key={item.id}>
            <div><span className="reservation-number">{item.numero}</span><h3>{item.client.prenom} {item.client.nom}</h3><p>{dateLabel(item.dateArrivee)} — {dateLabel(item.dateDepart)} · {item.nombrePersonnes} voyageurs</p><p>{item.lignes.map((line) => `Ch. ${line.chambre.numero} · ${line.chambre.typeChambre.nom}`).join(' / ')}</p></div>
            <div className="staff-booking-actions"><StatusBadge status={item.statut} /><strong>{money(item.montantTotal)} {item.devise}</strong>
              {busyId === item.id ? <span className="field-hint">Mise à jour…</span> : <>
                {item.statut === 'EN_ATTENTE' && <button className="button button-small button-dark" onClick={() => updateBooking(item.id, 'CONFIRMEE')}>Confirmer</button>}
                {item.statut === 'CONFIRMEE' && <button className="button button-small button-dark" onClick={() => updateBooking(item.id, 'EN_COURS')}>Enregistrer l’arrivée</button>}
                {item.statut === 'EN_COURS' && <button className="button button-small button-dark" onClick={() => updateBooking(item.id, 'TERMINEE')}>Enregistrer le départ</button>}
                {['EN_ATTENTE', 'CONFIRMEE'].includes(item.statut) && <button className="text-button danger-button" onClick={() => updateBooking(item.id, 'ANNULEE')}>Annuler</button>}
              </>}
            </div>
          </article>
        ))}</div>
      )}
    </section></BackOfficeLayout>
  )
}
