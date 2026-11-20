import { useEffect, useMemo, useState } from 'react'
import { api, type Client } from '../../api'
import { ErrorMessage } from '../../shared/ui'
import { messageOf } from '../../shared/format'
import { BackOfficeLayout } from '../../layouts/BackOfficeLayout'

export function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ clients: Client[] }>('/clients?limite=100')
      .then(({ clients: list }) => setClients(list))
      .catch((cause: unknown) => setError(messageOf(cause)))
  }, [])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    if (!query) return clients
    return clients.filter((client) =>
      `${client.prenom} ${client.nom} ${client.email} ${client.telephone ?? ''}`
        .toLocaleLowerCase('fr')
        .includes(query),
    )
  }, [clients, search])

  return (
    <BackOfficeLayout>
      <section className="content-page staff-page">
        <div className="backoffice-page-heading">
          <div>
            <span className="eyebrow">RELATION CLIENT</span>
            <h1>Les clients <em>Hôtel H+</em></h1>
            <p>Consultez les coordonnées des personnes qui séjournent chez nous.</p>
          </div>
          <span className="backoffice-total">{clients.length} client{clients.length === 1 ? '' : 's'}</span>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        <section className="management-panel client-directory">
          <label className="client-search">
            <span className="sr-only">Rechercher un client</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, e-mail ou téléphone"
            />
          </label>
          {filteredClients.length ? (
            <div className="client-table-wrap">
              <table className="client-table">
                <thead><tr><th>CLIENT</th><th>COORDONNÉES</th><th>STATUT</th></tr></thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td><strong>{client.prenom} {client.nom}</strong></td>
                      <td><a href={`mailto:${client.email}`}>{client.email}</a><span>{client.telephone || 'Téléphone non renseigné'}</span></td>
                      <td><span className={`client-state ${client.actif ? 'is-active' : ''}`}>{client.actif ? 'Actif' : 'Inactif'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>{clients.length ? 'Aucun résultat pour cette recherche' : 'Aucun client à afficher'}</h3>
              <p>{clients.length ? 'Essayez un autre nom ou une autre adresse e-mail.' : 'Les nouveaux comptes clients apparaîtront ici.'}</p>
            </div>
          )}
        </section>
      </section>
    </BackOfficeLayout>
  )
}
