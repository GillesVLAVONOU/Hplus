export type Role = "CLIENT" | "RECEPTIONNISTE" | "ADMINISTRATEUR";
export type StatutReservation =
  "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

export interface AuthUser {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  typeCompte: "CLIENT" | "PERSONNEL";
}

export interface AuthResponse {
  utilisateur: AuthUser;
}

export interface TypeChambre {
  id: number;
  nom: string;
  description: string | null;
  equipements: string[];
  capacite: number;
  prixDeBase: string;
  actif: boolean;
  chambres?: Chambre[];
}

export interface Chambre {
  id: number;
  numero: string;
  etage: number | null;
  images: string[];
  statut: "DISPONIBLE" | "MAINTENANCE" | "HORS_SERVICE";
  typeChambre: TypeChambre;
}

export interface ResultatDisponibilites {
  chambres: Chambre[];
  capaciteDisponible: number;
  peutAccueillir: boolean;
}

export interface Client {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  actif: boolean;
}

export interface LigneReservation {
  id: number;
  prixParNuit: string;
  nombreNuits: number;
  sousTotal: string;
  chambre: Chambre;
}

export interface Reservation {
  id: number;
  numero: string;
  dateArrivee: string;
  dateDepart: string;
  nombrePersonnes: number;
  statut: StatutReservation;
  montantTotal: string;
  devise: string;
  lignes: LigneReservation[];
  client: Client;
  creeLe: string;
}

export interface IndisponibiliteChambre {
  id: number;
  dateDebut: string;
  dateFin: string;
  motif: string;
  chambre: Chambre;
  creeLe: string;
}

export interface TableauDeBord {
  reservations: {
    total: number;
    enAttente: number;
    confirmees: number;
    enCours: number;
    terminees: number;
    annulees: number;
  };
  occupation: {
    chambresTotales: number;
    chambresOperationnelles: number;
    chambresOccupees: number;
    tauxPourcent: number;
    date: string;
  };
}

export interface UtilisateurPersonnel {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
}

const baseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

export function apiAssetUrl(path: string): string {
  return new URL(path, new URL(baseUrl, window.location.origin)).toString();
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const body = payload as
      { message?: string | string[]; error?: string } | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message || body?.error || `Erreur API (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T = void>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  postForm: <T = void>(path: string, body: FormData) =>
    request<T>(path, { method: "POST", body }),
  patch: <T = void>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};
