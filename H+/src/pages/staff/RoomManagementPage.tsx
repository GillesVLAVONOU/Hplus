import { useEffect, useState, type FormEvent } from 'react'
import { api, type Chambre, type TypeChambre } from '../../api'
import { ErrorMessage } from '../../shared/ui'
import { messageOf, money } from '../../shared/format'
import { BackOfficeLayout } from '../../layouts/BackOfficeLayout'
import { useAuth } from '../../auth-context'

export function RoomManagementPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Chambre[]>([])
  const [types, setTypes] = useState<TypeChambre[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const [roomList, typeList] = await Promise.all([
      api.get<Chambre[]>('/chambres'),
      api.get<TypeChambre[]>(user?.role === 'ADMINISTRATEUR' ? '/types-chambres/tous' : '/types-chambres'),
    ])
    setRooms(roomList)
    setTypes(typeList)
  }
  useEffect(() => {
    void Promise.all([
      api.get<Chambre[]>('/chambres'),
      api.get<TypeChambre[]>(user?.role === 'ADMINISTRATEUR' ? '/types-chambres/tous' : '/types-chambres'),
    ]).then(([roomList, typeList]) => {
      setRooms(roomList)
      setTypes(typeList)
    }).catch((cause: unknown) => setError(messageOf(cause)))
  }, [user?.role])

  async function addRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(formElement)
    const request = new FormData()
    request.append('numero', String(form.get('numero') ?? ''))
    request.append('typeChambreId', String(form.get('typeChambreId') ?? ''))
    const etage = form.get('etage')
    if (typeof etage === 'string' && etage) request.append('etage', etage)
    for (const image of form.getAll('images')) {
      if (image instanceof File && image.size > 0) request.append('images', image)
    }
    try {
      await api.postForm('/chambres', request)
      setMessage('La chambre a été ajoutée.')
      formElement.reset()
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  async function setRoomStatus(room: Chambre, statut: string) {
    setError('')
    try {
      await api.patch(`/chambres/${room.id}`, { statut })
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    }
  }

  async function addType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    const form = new FormData(formElement)
    try {
      await api.post('/types-chambres', {
        nom: form.get('nom'),
        capacite: Number(form.get('capacite')),
        prixDeBase: form.get('prixDeBase'),
        description: form.get('description'),
        equipements: String(form.get('equipements') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
      })
      setMessage('La catégorie a été ajoutée.')
      formElement.reset()
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  async function updateType(type: TypeChambre, changes: Partial<TypeChambre>) {
    try {
      await api.patch(`/types-chambres/${type.id}`, changes)
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    }
  }

  return (
    <BackOfficeLayout><section className="content-page staff-page">
      <span className="eyebrow">Espace équipe</span><h1>Les espaces<br /><em>de la maison.</em></h1>
      <ErrorMessage>{error}</ErrorMessage>
      {message && <p className="notice notice-success" role="status">{message}</p>}
      <div className="management-grid">
        <section className="management-panel"><div className="section-heading"><div><span className="eyebrow">Le catalogue</span><h2>Catégories</h2></div></div>
          {types.map((type) => <div className="management-row" key={type.id}><div><strong>{type.nom}</strong><span>{type.capacite} voyageurs · {money(type.prixDeBase)} XOF</span></div>{user?.role === 'ADMINISTRATEUR' && <button className="text-button" onClick={() => updateType(type, { actif: !type.actif })}>{type.actif ? 'Désactiver' : 'Réactiver'}</button>}</div>)}
          {user?.role === 'ADMINISTRATEUR' && <form className="form-stack inline-form" onSubmit={addType}><h3>Ajouter une catégorie</h3><label>Nom<input name="nom" required maxLength={80} /></label><div className="form-row"><label>Capacité<input name="capacite" type="number" min="1" required /></label><label>Prix / nuit (XOF)<input name="prixDeBase" type="number" min="1" step="0.01" required /></label></div><label>Description<input name="description" /></label><label>Équipements <span className="optional">(séparés par des virgules)</span><input name="equipements" /></label><button className="button button-dark" disabled={busy}>Ajouter la catégorie</button></form>}
        </section>
        <section className="management-panel"><div className="section-heading"><div><span className="eyebrow">Les chambres</span><h2>{rooms.length} chambre{rooms.length > 1 ? 's' : ''}</h2></div></div>
          {rooms.map((room) => <div className="management-row" key={room.id}><div><strong>Chambre {room.numero}</strong><span>{room.typeChambre.nom} · étage {room.etage ?? '—'}</span></div><select aria-label={`État de la chambre ${room.numero}`} value={room.statut} onChange={(event) => void setRoomStatus(room, event.target.value)}><option value="DISPONIBLE">Disponible</option><option value="MAINTENANCE">Maintenance</option><option value="HORS_SERVICE">Hors service</option></select></div>)}
          {user?.role === 'ADMINISTRATEUR' && <form className="form-stack inline-form" onSubmit={addRoom}><h3>Ajouter une chambre</h3><div className="form-row"><label>Numéro<input name="numero" required maxLength={20} /></label><label>Étage<input name="etage" type="number" /></label></div><label>Catégorie<select name="typeChambreId" required defaultValue=""><option value="" disabled>Choisir une catégorie</option>{types.filter((type) => type.actif).map((type) => <option key={type.id} value={type.id}>{type.nom}</option>)}</select></label><label>Photos <span className="optional">(jusqu’à 8 images JPEG, PNG ou WebP, 5 Mo chacune)</span><span className="room-images-picker"><input className="room-images-input" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></span></label><button className="button button-dark" disabled={busy}>Ajouter la chambre</button></form>}
        </section>
      </div>
    </section></BackOfficeLayout>
  )
}
