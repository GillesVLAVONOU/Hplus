import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type Chambre, type Client, type Reservation, type ResultatDisponibilites } from '../../api'
import { ErrorMessage, StatusBadge } from '../../shared/ui'
import { dateLabel, dayOffset, messageOf, money } from '../../shared/format'
import { HotelIcon } from '../../icons'
import { SiteLayout } from '../../layouts/SiteLayout'
import { useAuth } from '../../auth-context'

export function BookingPage() {
  const [params] = useSearchParams()
  const arrival = params.get('arrivee') ?? ''
  const departure = params.get('depart') ?? ''
  const people = Number(params.get('personnes') ?? 1)
  const ids = useMemo(() => (params.get('chambresIds') ?? '').split(',').map(Number).filter(Number.isInteger), [params])
  const [rooms, setRooms] = useState<Chambre[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Reservation | null>(null)

  useEffect(() => {
    if (!arrival || !departure || !ids.length) return
    const query = new URLSearchParams({ arrivee: arrival, depart: departure, personnes: String(people) })
    api.get<ResultatDisponibilites>(`/chambres/disponibles?${query}`)
      .then((result) => setRooms(result.chambres.filter((room) => ids.includes(room.id))))
      .catch((cause: unknown) => setError(messageOf(cause)))
  }, [arrival, departure, ids, people])

  async function confirmBooking(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const reservation = await api.post<Reservation>('/reservations', {
        dateArrivee: arrival,
        dateDepart: departure,
        nombrePersonnes: people,
        chambresIds: ids,
      })
      setCreated(reservation)
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  if (!arrival || !departure || !ids.length) {
    return <SiteLayout><div className="content-page"><span className="eyebrow">Votre séjour</span><h1>Commençons par vos dates.</h1><p>Choisissez vos dates et vos chambres depuis la recherche de disponibilités.</p><Link className="button button-dark" to="/#recherche">Rechercher une chambre</Link></div></SiteLayout>
  }
  if (created) return (
    <SiteLayout><section className="confirmation-page"><span className="confirmation-check">✓</span><span className="eyebrow">C’est noté</span><h1>Votre séjour<br /><em>prend forme.</em></h1><p>Votre demande <strong>{created.numero}</strong> est en attente de confirmation. Retrouvez-la à tout moment dans votre espace.</p><div className="confirmation-summary"><span>{dateLabel(arrival)} — {dateLabel(departure)}</span><strong>{money(created.montantTotal)} {created.devise}</strong></div><Link className="button button-dark" to="/compte">Voir mon séjour</Link></section></SiteLayout>
  )

  return (
    <SiteLayout>
      <section className="content-page booking-page">
        <span className="eyebrow">Dernière étape</span>
        <h1>Votre séjour,<br /><em>en quelques clics.</em></h1>
        <div className="booking-summary">
          <div><span>Arrivée</span><strong>{dateLabel(arrival)}</strong></div>
          <div><span>Départ</span><strong>{dateLabel(departure)}</strong></div>
          <div><span>Voyageurs</span><strong>{people}</strong></div>
        </div>
        <h2>Votre sélection</h2>
        {rooms.length !== ids.length && <ErrorMessage>Une chambre sélectionnée n’est plus disponible. Retournez à la recherche pour choisir à nouveau.</ErrorMessage>}
        <div className="selected-rooms">{rooms.map((room) => <div className="selected-room" key={room.id}><span>Chambre {room.numero} · {room.typeChambre.nom}</span><strong>{money(room.typeChambre.prixDeBase)} XOF / nuit</strong></div>)}</div>
        <ErrorMessage>{error}</ErrorMessage>
        <form onSubmit={confirmBooking}>
          <button className="button button-terracotta" disabled={busy || rooms.length !== ids.length}>{busy ? 'Enregistrement…' : 'Confirmer ma demande'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="booking-note">Votre demande bloque les chambres sélectionnées pendant 30 minutes. Aucun paiement n’est effectué en ligne.</p>
      </section>
    </SiteLayout>
  )
}

export function AccountPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    const [bookings, profile] = await Promise.all([
      api.get<Reservation[]>('/reservations/mes-reservations'),
      api.get<Client>('/clients/moi'),
    ])
    setReservations(bookings)
    setClient(profile)
  }
  useEffect(() => {
    void Promise.all([
      api.get<Reservation[]>('/reservations/mes-reservations'),
      api.get<Client>('/clients/moi'),
    ]).then(([bookings, profile]) => {
      setReservations(bookings)
      setClient(profile)
    }).catch((cause: unknown) => setError(messageOf(cause)))
  }, [user?.id])

  async function cancel(id: number) {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await api.patch(`/reservations/${id}/annulation`, {})
      setMessage('Votre réservation a bien été annulée.')
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SiteLayout>
      <section className="content-page account-page">
        <span className="eyebrow">Votre espace H+</span>
        <h1>Bonjour {user?.prenom},<br /><em>vous êtes chez vous.</em></h1>
        {client && <p className="account-email">{client.email}</p>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {message && <p className="notice notice-success" role="status">{message}</p>}
        <div className="section-heading"><div><span className="eyebrow">Vos prochaines parenthèses</span><h2>Mes réservations</h2></div><Link className="underlined-link" to="/#recherche">Réserver un séjour ↗</Link></div>
        {reservations.length === 0 ? (
          <div className="empty-state"><HotelIcon /><h3>Votre prochain séjour commence ici</h3><p>Vos réservations apparaîtront dans cet espace.</p><Link className="button button-dark" to="/#recherche">Trouver une chambre</Link></div>
        ) : (
          <div className="reservation-list">
            {reservations.map((reservation) => (
              <article className="reservation-card" key={reservation.id}>
                <div className="reservation-card-top"><span className="reservation-number">{reservation.numero}</span><StatusBadge status={reservation.statut} /></div>
                <h3>{reservation.lignes.map((line) => `${line.chambre.typeChambre.nom} · ${line.chambre.numero}`).join(' / ')}</h3>
                <p>{dateLabel(reservation.dateArrivee)} — {dateLabel(reservation.dateDepart)} · {reservation.nombrePersonnes} voyageurs</p>
                <div className="reservation-card-bottom"><strong>{money(reservation.montantTotal)} {reservation.devise}</strong>
                  {['EN_ATTENTE', 'CONFIRMEE'].includes(reservation.statut) && reservation.dateArrivee > dayOffset(0) && (
                    <button className="text-button danger-button" disabled={busyId === reservation.id} onClick={() => cancel(reservation.id)}>{busyId === reservation.id ? 'Annulation…' : 'Annuler cette réservation'}</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  )
}
