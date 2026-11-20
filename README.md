# API de réservation d’hôtel

Backend NestJS/TypeORM et PostgreSQL pour les réservations, les chambres, les
clients, le personnel, l’authentification et l’audit. Les routes sont préfixées
par `/api`. Les dates métier sont des jours (`YYYY-MM-DD`) interprétés dans le
fuseau de l’hôtel.

## Démarrage local

1. Installer PostgreSQL et créer une base `hotel`.
2. Copier `.env.example` vers `.env`, puis renseigner les identifiants PostgreSQL
   et une valeur secrète aléatoire pour `JWT_SECRET`.
3. Installer et compiler :

   ```powershell
   npm install
   npm run build
   ```

4. Appliquer le schéma :

   ```powershell
   npm run migration:run
   ```

5. Créer le premier compte administrateur. Ajouter temporairement dans `.env`
   `INITIAL_ADMIN_NOM`, `INITIAL_ADMIN_PRENOM`, `INITIAL_ADMIN_EMAIL` et
   `INITIAL_ADMIN_PASSWORD`, puis exécuter :

   ```powershell
   npm run seed:admin
   ```

   Le script refuse de créer un second administrateur. Retirer ensuite le mot de
   passe initial du fichier `.env`.
6. Démarrer l’API :

   ```powershell
   npm run start:dev
   ```

Les migrations sont le seul mécanisme de gestion du schéma dans tous les
environnements (`synchronize` est désactivé). En production, définir
`NODE_ENV=production` pour activer le cookie de session sécurisé, puis exécuter
`npm run migration:run` comme étape de déploiement avant de démarrer l’application.

Les administrateurs peuvent ajouter jusqu’à huit images JPEG, PNG ou WebP
(5 Mo chacune) lors de la création d’une chambre. Les fichiers sont stockés
dans `uploads/chambres`, servis sous `/uploads/` et exclus du contrôle de version.
Conservez ce dossier lors des sauvegardes et déploiements.

## Règles métier appliquées

- Une réservation contient une ou plusieurs chambres ; le serveur contrôle la
  capacité cumulée et recalcule le prix depuis le tarif de chaque type.
- Les périodes suivent l’intervalle `[arrivée, départ)` : deux séjours peuvent
  se suivre le même jour. Le départ doit être postérieur à l’arrivée.
- Une chambre en maintenance ou hors service n’est pas réservable. Les
  chevauchements sont bloqués pour les réservations confirmées/en cours et pour
  les réservations en attente pendant 30 minutes.
- Le personnel peut créer des périodes d’indisponibilité ponctuelle par chambre.
  Elles utilisent aussi l’intervalle `[début, fin)`, ne peuvent chevaucher une
  réservation ou un autre blocage, et sont exclues de la recherche publique.
- Le planning du personnel accepte des périodes d’au plus 62 jours ; il inclut
  les réservations actives et les indisponibilités correspondantes.
- La création et la modification des lignes sont transactionnelles. Les
  chambres sont verrouillées dans un ordre stable pendant la vérification et
  l’écriture, afin d’éviter deux réservations concurrentes pour la même chambre.
- Le prix est stocké en `numeric`, et calculé en centimes entiers. La devise par
  défaut est XOF.
- Un client ne consulte et n’annule que ses propres réservations. L’annulation
  client est permise avant la date d’arrivée locale de l’hôtel.
- Les transitions du personnel sont limitées : attente vers confirmée/annulée,
  confirmée vers en cours/annulée, puis en cours vers terminée.
- Les mots de passe sont hachés avec bcrypt ; les routes sensibles utilisent des
  jetons JWT et les rôles `CLIENT`, `RECEPTIONNISTE` et `ADMINISTRATEUR`.

## Routes principales

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/clients/inscription` | Public |
| POST | `/api/authentification/connexion` | Public |
| GET | `/api/types-chambres` | Public |
| GET | `/api/chambres/disponibles?arrivee=YYYY-MM-DD&depart=YYYY-MM-DD&personnes=2` | Public |
| POST | `/api/reservations` | Client |
| GET | `/api/reservations/mes-reservations` | Client |
| PATCH | `/api/reservations/:id/annulation` | Client propriétaire |
| GET / POST | `/api/personnel/reservations` | Personnel |
| PATCH | `/api/personnel/reservations/:id` | Personnel |
| PATCH | `/api/personnel/reservations/:id/statut` | Personnel |
| GET | `/api/personnel/planning?debut=YYYY-MM-DD&fin=YYYY-MM-DD` | Réceptionniste / administrateur |
| POST | `/api/personnel/indisponibilites` | Réceptionniste / administrateur |
| DELETE | `/api/personnel/indisponibilites/:id` | Réceptionniste / administrateur |
| POST / PATCH | `/api/chambres`, `/api/types-chambres` | Administrateur |
| GET / POST / PATCH | `/api/personnel` | Administrateur |
| GET | `/api/tableau-de-bord` | Réceptionniste / administrateur |
| GET | `/api/audit` | Administrateur |

Une réservation en ligne est créée en `EN_ATTENTE` et bloque les chambres
pendant 30 minutes. Le paiement en ligne n’est pas inclus dans cette version.

## Exemples d’appels

Connexion :

```json
{
  "email": "client@example.com",
  "motDePasse": "MotDePasseSecurise123",
  "typeCompte": "CLIENT"
}
```

La connexion place le jeton dans un cookie `HttpOnly` nommé
`hplus_access_token`. Le navigateur le transmet automatiquement ; les clients
HTTP non navigateur peuvent encore utiliser `Authorization: Bearer <jeton>`.
Les comptes client et personnel partagent un espace d’adresses e-mail unique.

Création d’une réservation par un client :

```json
{
  "dateArrivee": "2027-01-10",
  "dateDepart": "2027-01-13",
  "nombrePersonnes": 3,
  "chambresIds": [2, 5]
}
```

La réservation au comptoir utilise le même corps avec `clientId` ajouté.

Créer une indisponibilité de chambre :

```json
{
  "chambreId": 2,
  "dateDebut": "2027-01-10",
  "dateFin": "2027-01-13",
  "motif": "Travaux de rénovation"
}
```

## Vérification

```powershell
npm run build
npm test
```

Le frontend et l’API doivent être servis sur la même origine de site pour que le
cookie `SameSite=Lax` fonctionne. En production, HTTPS est requis pour le cookie
`Secure`.

Les tests e2e et les migrations requièrent un PostgreSQL accessible avec les
variables de `.env`.
