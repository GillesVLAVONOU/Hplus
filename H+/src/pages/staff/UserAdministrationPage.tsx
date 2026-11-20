import { useEffect, useState, type FormEvent } from 'react'
import { api, type Role, type UtilisateurPersonnel } from '../../api'
import { ErrorMessage } from '../../shared/ui'
import { messageOf } from '../../shared/format'
import { BackOfficeLayout } from '../../layouts/BackOfficeLayout'

export function UserAdministrationPage() {
  const [users, setUsers] = useState<UtilisateurPersonnel[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = () => api.get<{ utilisateurs: UtilisateurPersonnel[] }>('/personnel?limite=100')
    .then(({ utilisateurs }) => setUsers(utilisateurs))
  useEffect(() => { void load().catch((cause: unknown) => setError(messageOf(cause))) }, [])

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(formElement)
    try {
      await api.post('/personnel', {
        nom: form.get('nom'),
        prenom: form.get('prenom'),
        email: form.get('email'),
        motDePasse: form.get('motDePasse'),
        role: form.get('role'),
      })
      setMessage('Le compte a été créé.')
      formElement.reset()
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  async function updateUser(user: UtilisateurPersonnel, changes: Partial<UtilisateurPersonnel>) {
    setError('')
    try {
      await api.patch(`/personnel/${user.id}`, changes)
      await load()
    } catch (cause) {
      setError(messageOf(cause))
    }
  }

  return (
    <BackOfficeLayout><section className="content-page staff-page">
      <span className="eyebrow">Administration H+</span><h1>Une équipe<br /><em>aux petits soins.</em></h1>
      <ErrorMessage>{error}</ErrorMessage>
      {message && <p className="notice notice-success" role="status">{message}</p>}
      <div className="management-panel user-list">
        <div className="section-heading"><div><span className="eyebrow">Les accès</span><h2>Comptes du personnel</h2></div></div>
        {users.map((person) => <div className="management-row" key={person.id}><div><strong>{person.prenom} {person.nom}</strong><span>{person.email}</span></div><div className="user-controls"><select aria-label={`Rôle de ${person.prenom}`} value={person.role} onChange={(event) => void updateUser(person, { role: event.target.value as Role })}><option value="RECEPTIONNISTE">Réceptionniste</option><option value="ADMINISTRATEUR">Administrateur</option></select><button className="text-button" onClick={() => void updateUser(person, { actif: !person.actif })}>{person.actif ? 'Désactiver' : 'Réactiver'}</button></div></div>)}
      </div>
      <form className="form-stack management-panel create-user-form" onSubmit={createUser}><span className="eyebrow">Nouvel accès</span><h2>Ajouter un membre</h2><div className="form-row"><label>Prénom<input name="prenom" required maxLength={80} /></label><label>Nom<input name="nom" required maxLength={80} /></label></div><label>Adresse e-mail<input name="email" type="email" required maxLength={160} /></label><label>Mot de passe provisoire<input name="motDePasse" type="password" required minLength={10} maxLength={128} /><span className="field-hint">10 caractères minimum, une minuscule, une majuscule et un chiffre.</span></label><label>Rôle<select name="role"><option value="RECEPTIONNISTE">Réceptionniste</option><option value="ADMINISTRATEUR">Administrateur</option></select></label><button className="button button-dark" disabled={busy}>{busy ? 'Création…' : 'Créer le compte'} <span>→</span></button></form>
    </section></BackOfficeLayout>
  )
}
