import { BadRequestException } from '@nestjs/common';
import {
  centimes,
  dateLocaleHotel,
  formaterMontant,
  validerPeriode,
} from './reservation.util.js';

describe('utilitaires de réservation', () => {
  it('calcule les nuits avec des dates sans heure', () => {
    expect(validerPeriode('2099-12-30', '2099-12-31')).toBe(1);
    expect(validerPeriode('2099-12-30', '2100-01-02')).toBe(3);
  });

  it('rejette une date impossible, un départ le jour de l’arrivée et une arrivée passée', () => {
    expect(() => validerPeriode('2099-02-29', '2099-03-01')).toThrow(
      BadRequestException,
    );
    expect(() => validerPeriode('2099-12-30', '2099-12-30')).toThrow(
      BadRequestException,
    );
    expect(() => validerPeriode('2000-01-01', '2000-01-02')).toThrow(
      BadRequestException,
    );
  });

  it('convertit les montants décimaux en centimes sans calcul flottant', () => {
    expect(centimes('123456.78')).toBe(12_345_678n);
    expect(formaterMontant(centimes('123456.78'))).toBe('123456.78');
    expect(formaterMontant(centimes('9'))).toBe('9.00');
  });

  it('rejette les montants invalides', () => {
    expect(() => centimes('-1.00')).toThrow(BadRequestException);
    expect(() => centimes('1.001')).toThrow(BadRequestException);
  });

  it('détermine la date locale selon le fuseau de l’hôtel', () => {
    expect(dateLocaleHotel(new Date('2026-10-31T23:30:00.000Z'))).toBe(
      '2026-11-01',
    );
  });

  it('lit le fuseau configuré au moment du calcul', () => {
    const fuseauPrecedent = process.env.HOTEL_TIME_ZONE;
    process.env.HOTEL_TIME_ZONE = 'America/Los_Angeles';
    try {
      expect(dateLocaleHotel(new Date('2026-10-31T23:30:00.000Z'))).toBe(
        '2026-10-31',
      );
    } finally {
      if (fuseauPrecedent === undefined) {
        delete process.env.HOTEL_TIME_ZONE;
      } else {
        process.env.HOTEL_TIME_ZONE = fuseauPrecedent;
      }
    }
  });
});
