import { apiAssetUrl, type Chambre } from '../api'
import { Link } from 'react-router-dom'
import { money } from '../shared/format'
import suiteHero from '../assets/suite-hero.jpg'
import suiteDetail from '../assets/suite-detail.jpg'
import hotelLobby from '../assets/hotel-lobby.jpg'

export function RoomIllustration({ variant = 0 }: { variant?: number }) {
  return (
    <div className={`room-illustration room-illustration-${variant % 4}`} aria-hidden="true">
      <div className="illustration-window"><span /></div>
      <div className="illustration-lamp" />
      <div className="illustration-bed"><span /><i /></div>
      <div className="illustration-plant"><i /><i /><i /></div>
      <span className="illustration-grain" />
    </div>
  )
}

export function RoomCard({
  room,
  selected,
  onSelect,
}: {
  room: Chambre
  selected: boolean
  onSelect: () => void
}) {
  return (
    <article className={`room-card ${selected ? 'is-selected' : ''}`}>
      <Link to={`/chambres/${room.typeChambre.id}`} className="room-card-photo-link" aria-label={`Voir le détail : ${room.typeChambre.nom}`}>
        <img className="room-card-photo" src={room.images?.[0] ? apiAssetUrl(room.images[0]) : [suiteHero, suiteDetail, hotelLobby][room.typeChambre.id % 3]} alt={`Chambre ${room.typeChambre.nom}`} />
      </Link>
      <div className="room-card-content">
        <div className="type-card-meta"><span>Chambre {room.numero}</span><span>{room.typeChambre.capacite} voyageurs</span></div>
        <h3><Link to={`/chambres/${room.typeChambre.id}`}>{room.typeChambre.nom}</Link></h3>
        <p>{room.typeChambre.description || 'Un espace accueillant, confortable et prêt à vous recevoir.'}</p>
        <div className="type-card-bottom">
          <span><strong>{money(room.typeChambre.prixDeBase)} XOF</strong> / nuit</span>
          <button className={`select-room ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
            {selected ? 'Sélectionnée ✓' : 'Choisir'}
          </button>
        </div>
      </div>
    </article>
  )
}
