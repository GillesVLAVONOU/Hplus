import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, apiAssetUrl, type Chambre, type ResultatDisponibilites, type TypeChambre } from '../../api'
import { ErrorMessage } from '../../shared/ui'
import { dateLabel, dayOffset, messageOf, money } from '../../shared/format'
import { HotelIcon } from '../../icons'
import { RoomCard } from '../../components/RoomCard'
import { SiteLayout } from '../../layouts/SiteLayout'
import suiteHero from '../../assets/suite-hero.jpg'
import hotelLobby from '../../assets/hotel-lobby.jpg'
import suiteDetail from '../../assets/suite-detail.jpg'
import suiteLounge from '../../assets/suite-lounge.jpg'
import hotelExterior from '../../assets/hotel-exterior.jpg'

function imageType(type: TypeChambre, index: number): string {
  const image = type.chambres?.find((chambre) => chambre.images?.length)?.images[0]
  return image ? apiAssetUrl(image) : [suiteHero, suiteDetail, hotelLobby][index % 3]
}

export function HomePage() {
  const [heroSlide, setHeroSlide] = useState(0)
  const heroSlides = [suiteHero, suiteDetail, suiteLounge, hotelExterior]
  const [types, setTypes] = useState<TypeChambre[]>([])
  const [results, setResults] = useState<ResultatDisponibilites | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [arrivee, setArrivee] = useState(dayOffset(1))
  const [depart, setDepart] = useState(dayOffset(2))
  const [personnes, setPersonnes] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  useEffect(() => {
    api.get<TypeChambre[]>('/types-chambres')
      .then(setTypes)
      .catch((cause: unknown) => setError(messageOf(cause)))
  }, [])

  async function search(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSelected([])
    setLoading(true)
    try {
      const query = new URLSearchParams({
        arrivee,
        depart,
        personnes: String(personnes),
      })
      setResults(await api.get<ResultatDisponibilites>(`/chambres/disponibles?${query}`))
    } catch (cause) {
      setError(messageOf(cause))
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  function continueBooking() {
    const params = new URLSearchParams({
      arrivee,
      depart,
      personnes: String(personnes),
      chambresIds: selected.join(','),
    })
    navigate(`/reservation?${params}`)
  }

  return (
    <SiteLayout>
      <section className="hero-section" id ="hero">
        <div className="hero-copy" data-reveal="hero">
          <h1><span>L’élégance</span><br /><em>de l’instant.</em></h1>
          <p>Une adresse rare, un accueil attentif et le plaisir de se sentir attendu.</p>
          <a className="button button-dark" href="#recherche">Réserver votre séjour </a>
        </div>
        <div className="hero-art hero-carousel" role="region" aria-label={`Galerie de l’hôtel H+, photo ${heroSlide + 1} sur ${heroSlides.length}`} data-reveal="scale" style={{ backgroundImage: `url(${heroSlides[heroSlide]})` }}>
          <div className="hero-art-caption">Hôtel H+ · L’art de recevoir</div>
          <div className="hero-carousel-controls" aria-label="Choisir une photo">
            {heroSlides.map((image, index) => <button key={image} type="button" aria-label={`Afficher la photo ${index + 1}`} aria-pressed={heroSlide === index} className={heroSlide === index ? 'is-active' : ''} onClick={() => setHeroSlide(index)} />)}
          </div>
        </div>
      </section>

      <section className="search-section" id="recherche">
        <div className="search-intro" data-reveal="left">
          <span className="eyebrow">Votre prochain séjour</span>
          <h2>Nous serons ravis<br /><em>de vous recevoir.</em></h2>
        </div>
        <form className="search-form" onSubmit={search} data-reveal="right">
          <label>
            <span>Arrivée</span>
            <input type="date" value={arrivee} min={dayOffset(0)} required onChange={(e) => setArrivee(e.target.value)} />
          </label>
          <label>
            <span>Départ</span>
            <input type="date" value={depart} min={arrivee} required onChange={(e) => setDepart(e.target.value)} />
          </label>
          <label>
            <span>Voyageurs</span>
            <select value={personnes} onChange={(e) => setPersonnes(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
                <option key={number} value={number}>{number} {number > 1 ? 'personnes' : 'personne'}</option>
              ))}
            </select>
          </label>
          <button className="button button-terracotta" disabled={loading}>
            {loading ? 'Recherche…' : 'Rechercher'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <ErrorMessage>{error}</ErrorMessage>
      </section>

      {results && (
        <section className="results-section" aria-live="polite" data-reveal="up">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Du {dateLabel(arrivee)} au {dateLabel(depart)}</span>
              <h2>Les chambres disponibles</h2>
            </div>
            <span className="results-count">{results.chambres.length} chambre{results.chambres.length > 1 ? 's' : ''}</span>
          </div>
          {results.chambres.length === 0 ? (
            <div className="empty-state"><HotelIcon /><h3>Pas de chambre disponible sur ces dates</h3><p>Essayez d’autres dates ou contactez notre équipe pour trouver une solution.</p></div>
          ) : (
            <>
              <div className="room-grid">
                {results.chambres.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={selected.includes(room.id)}
                    onSelect={() => setSelected((current) =>
                      current.includes(room.id)
                        ? current.filter((id) => id !== room.id)
                        : [...current, room.id],
                    )}
                  />
                ))}
              </div>
              <div className="booking-selection">
                <span>{selected.length} chambre{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}</span>
                <button className="button button-dark" disabled={!selected.length} onClick={continueBooking}>Continuer la réservation <span aria-hidden="true">→</span></button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="intro-section" id="chambres">
        <div className="intro-aside" data-reveal="left">
          <span className="eyebrow">Les chambres H+</span>
          <p>Chaque chambre a son caractère. Toutes ont en commun l’essentiel : le calme, le confort et l’attention aux détails.</p>
          <a className="underlined-link" href="#types">Découvrir les chambres <span aria-hidden="true">↗</span></a>
          <img className="intro-lobby-image" src={hotelLobby} alt="Salon raffiné de l’hôtel H+" />
        </div>
        <div className="intro-title" data-reveal="right"><span className="section-number">02 / H+</span><h2>Le luxe<br />de <em>l’essentiel.</em></h2></div>
      </section>

      <section className="types-section" id="types">
        <div className="section-heading" data-reveal="up">
          <div><span className="eyebrow">Nos catégories</span><h2>Un espace à votre mesure.</h2></div>
          <span className="section-number">01 — {String(types.length).padStart(2, '0')}</span>
        </div>
        {types.length === 0 ? (
          <div className="empty-state compact"><HotelIcon /><h3>Nos chambres se préparent</h3><p>Le catalogue sera disponible dès que les premières catégories auront été ajoutées.</p></div>
        ) : (
          <div className="room-grid">
            {types.map((type, index) => (
              <Link to={`/chambres/${type.id}`} className="type-card" key={type.id} data-reveal="scale">
                <img className={`room-photo room-photo-${index % 3}`} src={imageType(type, index)} alt={`${type.nom}, chambre de l’hôtel H+`} />
                <div className="type-card-content">
                  <div className="type-card-meta"><span>{String(index + 1).padStart(2, '0')}</span><span>{type.capacite} voyageurs</span></div>
                  <h3>{type.nom}</h3>
                  <p>{type.description || 'Un cocon confortable, imaginé pour vous offrir une parenthèse paisible.'}</p>
                  <div className="type-card-bottom"><span>À partir de <strong>{money(type.prixDeBase)} XOF</strong> / nuit</span><span className="circle-arrow">↗</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="manifesto-section">
        <span className="manifesto-mark" data-reveal="scale" aria-hidden="true">H+</span>
        <span className="eyebrow" data-reveal="up">L’esprit de la maison</span>
        <h2 data-reveal="up">Moins de bruit.<br /><em>Plus de présence.</em></h2>
        <p data-reveal="up">Un endroit où l’on arrive sans se presser. Où l’on prend le temps de bien dormir, de bien manger, de ne rien faire — et d’en profiter.</p>
        <span className="manifesto-signature" data-reveal="up">À bientôt chez H+</span>
      </section>
    </SiteLayout>
  )
}

export function RoomDetailPage() {
  const { id } = useParams()
  const typeId = Number(id)
  const navigate = useNavigate()
  const [room, setRoom] = useState<TypeChambre | null>(null)
  const [error, setError] = useState('')
  const [arrivee, setArrivee] = useState(dayOffset(1))
  const [depart, setDepart] = useState(dayOffset(2))
  const [personnes, setPersonnes] = useState(2)
  const [available, setAvailable] = useState<Chambre[]>([])
  const [searching, setSearching] = useState(false)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)

  useEffect(() => {
    api.get<TypeChambre>(`/types-chambres/${typeId}`)
      .then(setRoom)
      .catch((cause: unknown) => setError(messageOf(cause)))
  }, [typeId])

  async function rechercher(event: FormEvent) {
    event.preventDefault()
    setSearching(true)
    setError('')
    setAvailable([])
    setAvailabilityChecked(false)
    try {
      const query = new URLSearchParams({ arrivee, depart, personnes: String(personnes) })
      const result = await api.get<ResultatDisponibilites>(`/chambres/disponibles?${query}`)
      setAvailable(result.chambres.filter((chambre) => chambre.typeChambre.id === typeId))
      setAvailabilityChecked(true)
    } catch (cause) {
      setError(messageOf(cause))
      setAvailable([])
    } finally {
      setSearching(false)
    }
  }

  if (error) return <SiteLayout><div className="content-page"><ErrorMessage>{error}</ErrorMessage><Link to="/" className="underlined-link">Retour à l’accueil</Link></div></SiteLayout>
  if (!room) return <SiteLayout><div className="page-loading">Un instant, nous préparons votre visite…</div></SiteLayout>

  const roomImages = room.chambres?.flatMap((chambre) => chambre.images ?? []) ?? []

  return (
    <SiteLayout>
      <section className="detail-hero" style={{ backgroundImage: `url(${roomImages[0] ? apiAssetUrl(roomImages[0]) : suiteDetail})` }}>
        <div className="detail-hero-overlay"><span className="eyebrow">Les chambres H+ / {room.nom}</span><h1>Un espace<br /><em>pour souffler.</em></h1></div>
      </section>
      <section className="detail-content content-page">
        <div className="detail-main">
          <span className="eyebrow">L’essentiel, avec soin</span>
          <h2>{room.nom}</h2>
          <p>{room.description || 'Un lieu chaleureux et paisible, conçu pour le repos et les beaux moments.'}</p>
          {room.equipements?.length ? <div className="amenities"><h3>À votre disposition</h3><ul>{room.equipements.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
        </div>
        <aside className="detail-booking">
          <span>À partir de</span><strong>{money(room.prixDeBase)} <small>XOF</small></strong><span>par nuit · jusqu’à {room.capacite} voyageurs</span>
          <form className="detail-search" onSubmit={rechercher}>
            <label>Arrivée<input type="date" value={arrivee} min={dayOffset(0)} required onChange={(event) => setArrivee(event.target.value)} /></label>
            <label>Départ<input type="date" value={depart} min={arrivee} required onChange={(event) => setDepart(event.target.value)} /></label>
            <label>Voyageurs<select value={personnes} onChange={(event) => setPersonnes(Number(event.target.value))}>{Array.from({ length: room.capacite }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
            <button className="button button-terracotta" disabled={searching}>{searching ? 'Recherche…' : 'Vérifier les disponibilités'}</button>
          </form>
          {available.length > 0 && <div className="detail-available"><p>{available.length} chambre{available.length > 1 ? 's' : ''} disponible{available.length > 1 ? 's' : ''}</p>{available.map((chambre) => <button key={chambre.id} className="button button-dark" onClick={() => navigate(`/reservation?${new URLSearchParams({ arrivee, depart, personnes: String(personnes), chambresIds: String(chambre.id) })}`)}>Réserver la chambre {chambre.numero} →</button>)}</div>}
          {availabilityChecked && available.length === 0 && <p className="notice notice-error" role="status">Aucune chambre de cette catégorie n’est disponible pour les dates sélectionnées. Essayez d’autres dates.</p>}
        </aside>
      </section>
      <section className="detail-gallery" aria-label="Galerie de l’hôtel">
        {roomImages.length
          ? roomImages.map((image, index) => <img key={image} src={apiAssetUrl(image)} alt={`${room.nom} · photo ${index + 1}`} />)
          : <><img src={suiteHero} alt="Suite de l’hôtel H+" /><img src={hotelLobby} alt="Salon de l’hôtel H+" /></>}
      </section>
    </SiteLayout>
  )
}
