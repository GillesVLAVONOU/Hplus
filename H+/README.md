# Hôtel H+

Frontend React/TypeScript pour la recherche de chambres, les réservations clients et la gestion du personnel.

L’accueil utilise une mise en scène immersive, des animations d’entrée et des révélations progressives au défilement. Les animations respectent le réglage système de réduction des mouvements.

## Démarrage

```sh
npm install
npm run dev
```

Le backend NestJS est attendu à `http://localhost:3000/api`. Pour utiliser une autre adresse, définir `VITE_API_URL` dans un fichier `.env.local`, par exemple :

```env
VITE_API_URL=http://localhost:3000/api
```

Le serveur backend doit autoriser l’origine du frontend avec `FRONTEND_ORIGIN` (par défaut `http://localhost:5173`).
Les appels utilisent un cookie de session `HttpOnly` ; configure le frontend et
l’API sur la même origine de site, et utilise HTTPS en production.
Les photos ajoutées aux chambres sont servies par le backend sous `/uploads/`.

L’espace équipe inclut un calendrier mensuel des réservations et permet aux
réceptionnistes et administrateurs de bloquer ou libérer des périodes
d’indisponibilité par chambre. Ces périodes ne sont pas proposées à la réservation.

## Vérifications

```sh
npm run build
npm run lint
npm test
```

Les illustrations sont temporaires et pourront être remplacées par les photos et le logo définitifs de l’hôtel.
