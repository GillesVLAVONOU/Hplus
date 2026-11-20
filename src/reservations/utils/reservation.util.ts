import { BadRequestException } from '@nestjs/common';

export const DUREE_BLOCAGE_MINUTES = 30;

export function obtenirFuseauHotel(): string {
  return process.env.HOTEL_TIME_ZONE || 'Africa/Porto-Novo';
}

export function validerPeriode(dateArrivee: string, dateDepart: string): number {
  const debut = dateUTC(dateArrivee);
  const fin = dateUTC(dateDepart);
  if (!debut || !fin || fin <= debut) {
    throw new BadRequestException(
      'Les dates doivent être valides et le départ postérieur à l’arrivée.',
    );
  }
  const aujourdHui = dateLocaleHotel(new Date());
  if (dateArrivee < aujourdHui) {
    throw new BadRequestException('La date d’arrivée ne peut pas être passée.');
  }
  return Math.round((fin - debut) / 86_400_000);
}

export function dateLocaleHotel(instant: Date): string {
  const fuseau = obtenirFuseauHotel();
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: fuseau,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant);
  } catch {
    throw new Error(`Le fuseau horaire de l’hôtel est invalide : ${fuseau}`);
  }
}

export function centimes(prix: string): bigint {
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(prix)) {
    throw new BadRequestException('Le tarif doit être un montant positif valide.');
  }
  const [unites, decimales = ''] = prix.split('.');
  return BigInt(unites) * 100n + BigInt(decimales.padEnd(2, '0'));
}

export function formaterMontant(valeur: bigint): string {
  return `${valeur / 100n}.${(valeur % 100n).toString().padStart(2, '0')}`;
}

function dateUTC(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date) {
    return null;
  }
  return value;
}
