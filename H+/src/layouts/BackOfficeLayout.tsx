import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";
import logo from "../assets/hplus-logo.png";

const navigation = [
  { to: "/personnel", label: "Vue d’ensemble", icon: "⌂", staff: true },
  {
    to: "/personnel/reservations",
    label: "Réservations",
    icon: "▤",
    staff: true,
  },
  { to: "/personnel/planning", label: "Planning", icon: "▦", staff: true },
  { to: "/personnel/chambres", label: "Chambres", icon: "▦", admin: true },
  { to: "/personnel/clients", label: "Clients", icon: "♙", staff: true },
  {
    to: "/administration/utilisateurs",
    label: "Équipe",
    icon: "♧",
    admin: true,
  },
];

export function BackOfficeLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`backoffice-shell ${menuOpen ? "backoffice-menu-open" : ""}`}
    >
      <button
        className="backoffice-backdrop"
        aria-label="Fermer le menu"
        onClick={() => setMenuOpen(false)}
      />
      <aside className="backoffice-sidebar">
        <Link
          to="/personnel"
          className="backoffice-brand"
          aria-label="H+ — tableau de bord"
        >
          <img className="backoffice-brand-logo" src={logo} alt="" />
          <span>
            H+ <small>ESPACE ÉQUIPE</small>
          </span>
        </Link>
        <p className="backoffice-nav-label">GESTION</p>
        <nav className="backoffice-nav" aria-label="Navigation du personnel">
          {navigation
            .filter(
              (item) =>
                (!item.admin || user?.role === "ADMINISTRATEUR") &&
                (!item.staff || user?.typeCompte === "PERSONNEL"),
            )
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`backoffice-nav-item ${location.pathname === item.to ? "is-active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="backoffice-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="backoffice-sidebar-bottom">
          <Link to="/" className="backoffice-site-link">
            ↗ <span>Voir le site</span>
          </Link>
          <div className="backoffice-profile">
            <span className="backoffice-avatar">
              {user?.prenom.slice(0, 1)}
              {user?.nom.slice(0, 1)}
            </span>
            <span className="backoffice-profile-copy">
              {user?.prenom} {user?.nom}
              <small>
                {user?.role === "ADMINISTRATEUR"
                  ? "Administrateur"
                  : "Réceptionniste"}
              </small>
            </span>
          </div>
          <button className="backoffice-logout" onClick={signOut}>
            Déconnexion <span aria-hidden="true">↗</span>
          </button>
        </div>
      </aside>
      <div className="backoffice-main">
        <header className="backoffice-topbar">
          <button
            className="backoffice-menu-toggle"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="backoffice-breadcrumb">
            <span>Hôtel H+</span>
            <span aria-hidden="true">/</span>
            <strong>
              {navigation.find((item) => location.pathname === item.to)
                ?.label ?? "Administration"}
            </strong>
          </div>
          <div className="backoffice-topbar-user">
            <span>
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(
                new Date(),
              )}
            </span>
            <span className="backoffice-avatar">
              {user?.prenom.slice(0, 1)}
              {user?.nom.slice(0, 1)}
            </span>
          </div>
        </header>
        <main className="backoffice-content">{children}</main>
      </div>
    </div>
  );
}
