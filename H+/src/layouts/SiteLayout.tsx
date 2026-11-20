import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-context'
import logo from '../assets/hplus-logo.png'

export function SiteHeader() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const staff = user?.typeCompte === 'PERSONNEL'
  const links = staff
    ? [
        { to: '/personnel', text: 'Tableau de bord' },
        { to: '/personnel/reservations', text: 'Réservations' },
        ...(user.role === 'ADMINISTRATEUR'
          ? [
              { to: '/personnel/chambres', text: 'Chambres' },
              { to: '/personnel/types-chambres', text: 'Catégories' },
              { to: '/administration/utilisateurs', text: 'Équipe' },
            ]
          : []),
      ]
    : [
        { to: '/', text: 'Découvrir' },
        { to: '/#types', text: 'Nos chambres' },
        ...(user ? [{ to: '/compte', text: 'Mon séjour' }] : []),
      ]

  useEffect(() => {
    if (!menuOpen) return

    function closeOnOutsideClick(event: PointerEvent) {
      if (!window.matchMedia('(max-width: 760px)').matches) return
      if (!(event.target instanceof Node)) return
      if (navRef.current?.contains(event.target) || menuToggleRef.current?.contains(event.target)) return
      setMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [menuOpen])

  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="H+ — accueil">
        <img className="brand-logo" src={logo} alt="" />
        <span className="brand-name"><span>Hôtel</span></span>
      </Link>
      <button
        ref={menuToggleRef}
        className="menu-toggle"
        aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span /><span />
      </button>
      <nav ref={navRef} className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navigation principale">
        {links.map((link) => (
          <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>{link.text}</Link>
        ))}
        {user ? (
          <div className="nav-account">
            <span className="nav-greeting">Bonjour, {user.prenom}</span>
            <button className="text-button" onClick={signOut}>Déconnexion</button>
          </div>
        ) : (
          <Link to="/connexion" className="nav-login">Espace client <span aria-hidden="true">↗</span></Link>
        )}
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-intro">
          <Link to="/" className="brand brand-footer">
            <img className="brand-logo" src={logo} alt="" />
            <span className="brand-name"><span>Hôtel</span></span>
          </Link>
          <p>Un lieu pour ralentir, se retrouver et savourer chaque instant.</p>
        </div>
        <nav className="footer-links" aria-label="Découvrir l’hôtel">
          <h2>Découvrir</h2>
          <Link to="/#hero">L’hôtel H+</Link>
          <Link to="/#types">Nos chambres</Link>
          <Link to="/#recherche">Réserver un séjour</Link>
        </nav>
        <nav className="footer-links" aria-label="Espace client">
          <h2>Votre séjour</h2>
          <Link to="/connexion">Se connecter</Link>
          <Link to="/inscription">Créer un compte</Link>
          <Link to="/compte">Mes réservations</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span className="footer-note">© {new Date().getFullYear()} Hôtel H+. Tous droits réservés.</span>
        <Link className="footer-home-link" to="/#hero">Retour à l’accueil <span aria-hidden="true">↑</span></Link>
      </div>
    </footer>
  )
}

export function SiteLayout({ children, showFooter = true }: { children: ReactNode; showFooter?: boolean }) {
  const location = useLocation()
  const layoutRef = useRef<HTMLDivElement>(null)
  const [motionReady, setMotionReady] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const layout = layoutRef.current
    if (!layout || !('IntersectionObserver' in window)) return

    const elements = layout.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!elements.length) return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' })

    elements.forEach((element) => observer.observe(element))
    setMotionReady(true)
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    if (!location.hash) return

    const targetId = decodeURIComponent(location.hash.slice(1))
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.hash, location.key])

  return (
    <div
      className={`site-layout ${location.pathname === '/' ? 'site-layout-home' : ''} ${['/connexion', '/inscription'].includes(location.pathname) ? 'site-layout-auth' : ''}`}
      data-motion-ready={motionReady}
      ref={layoutRef}
    >
      <SiteHeader />
      <main>{children}</main>
      {showFooter && <SiteFooter />}
    </div>
  )
}
