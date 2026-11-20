import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { ErrorMessage } from '../../shared/ui'
import { messageOf } from '../../shared/format'
import { useAuth } from '../../auth-context'
import { SiteLayout } from '../../layouts/SiteLayout'
import suiteHero from '../../assets/suite-hero.jpg'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, signIn } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const modeSwitch = isRegister ? '/connexion' : '/inscription'
  const nextDestination = searchParams.get('next')
  const modeSwitchUrl = nextDestination
    ? `${modeSwitch}?${new URLSearchParams({ next: nextDestination })}`
    : modeSwitch
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={user.typeCompte === 'PERSONNEL' ? '/personnel' : '/compte'} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    let defaultDestination = '/compte'
    try {
      if (isRegister) {
        await api.post('/clients/inscription', {
          nom: form.get('nom'),
          prenom: form.get('prenom'),
          email: form.get('email'),
          telephone: form.get('telephone') || undefined,
          motDePasse: form.get('motDePasse'),
        })
        await signIn(String(form.get('email')), String(form.get('motDePasse')))
      } else {
        const response = await signIn(
          String(form.get('email')),
          String(form.get('motDePasse')),
        )
        defaultDestination = response.utilisateur.typeCompte === 'PERSONNEL'
          ? '/personnel'
          : '/compte'
      }
      const requestedDestination = searchParams.get('next')
      const destination =
        requestedDestination?.startsWith('/') &&
        !requestedDestination.startsWith('//') &&
        !requestedDestination.includes('\\')
          ? requestedDestination
          : null
      navigate(destination ?? defaultDestination, { replace: true })
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SiteLayout showFooter={false}>
      <section className="auth-page">
        <div className="auth-art" style={{ backgroundImage: `url(${suiteHero})` }}><div className="auth-art-copy"><span className="eyebrow">Hôtel H+</span><h2>L’élégance<br />de <em>l’instant.</em></h2></div></div>
        <div className="auth-panel">
          <span className="eyebrow">{isRegister ? 'Bienvenue chez vous' : 'Nous sommes heureux de vous revoir'}</span>
          <h1>{isRegister ? 'Créer mon compte' : 'Se connecter'}</h1>
          <p>{isRegister ? 'Quelques informations et votre prochaine parenthèse sera à portée de main.' : 'Retrouvez vos séjours et vos envies d’évasion.'}</p>
          <form className="form-stack" onSubmit={submit}>
            {isRegister && <>
              <div className="form-row">
                <label>Prénom<input name="prenom" autoComplete="given-name" required maxLength={80} /></label>
                <label>Nom<input name="nom" autoComplete="family-name" required maxLength={80} /></label>
              </div>
              <label>Téléphone <span className="optional">(facultatif)</span><input name="telephone" type="tel" autoComplete="tel" maxLength={30} /></label>
            </>}
            <label>Adresse e-mail<input name="email" type="email" autoComplete="email" required maxLength={160} /></label>
            <label>Mot de passe<input name="motDePasse" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 10 : 1} maxLength={128} />{isRegister && <span className="field-hint">10 caractères minimum, avec une minuscule, une majuscule et un chiffre.</span>}</label>
            <ErrorMessage>{error}</ErrorMessage>
            <button className="button button-dark button-wide" disabled={busy}>{busy ? 'Un instant…' : isRegister ? 'Créer mon compte' : 'Continuer'}</button>
          </form>
          <p className="auth-alternate">{isRegister ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'} <Link to={modeSwitchUrl}>{isRegister ? 'Se connecter' : 'Créer un compte'}</Link></p>
        </div>
      </section>
    </SiteLayout>
  )
}
