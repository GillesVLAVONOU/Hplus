import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialHotelSchema20261031000000 implements MigrationInterface {
  name = 'InitialHotelSchema20261031000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "types_chambres" (
        "id" SERIAL PRIMARY KEY,
        "nom" varchar(80) NOT NULL UNIQUE,
        "description" text,
        "equipements" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "capacite" integer NOT NULL CHECK ("capacite" > 0),
        "prix_de_base" numeric(12,2) NOT NULL CHECK ("prix_de_base" > 0),
        "actif" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" SERIAL PRIMARY KEY,
        "nom" varchar(80) NOT NULL,
        "prenom" varchar(80) NOT NULL,
        "email" varchar(160) NOT NULL UNIQUE,
        "telephone" varchar(30),
        "mot_de_passe_hache" varchar NOT NULL,
        "actif" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "utilisateurs_personnel" (
        "id" SERIAL PRIMARY KEY,
        "nom" varchar(80) NOT NULL,
        "prenom" varchar(80) NOT NULL,
        "email" varchar(160) NOT NULL UNIQUE,
        "mot_de_passe_hache" varchar NOT NULL,
        "role" varchar(20) NOT NULL
          CHECK ("role" IN ('RECEPTIONNISTE', 'ADMINISTRATEUR')),
        "actif" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "chambres" (
        "id" SERIAL PRIMARY KEY,
        "numero" varchar(20) NOT NULL UNIQUE,
        "etage" integer,
        "statut" varchar(20) NOT NULL DEFAULT 'DISPONIBLE'
          CHECK ("statut" IN ('DISPONIBLE', 'MAINTENANCE', 'HORS_SERVICE')),
        "type_chambre_id" integer NOT NULL
          REFERENCES "types_chambres"("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" SERIAL PRIMARY KEY,
        "numero" varchar(30) NOT NULL UNIQUE,
        "date_arrivee" date NOT NULL,
        "date_depart" date NOT NULL CHECK ("date_depart" > "date_arrivee"),
        "nombre_personnes" integer NOT NULL CHECK ("nombre_personnes" > 0),
        "statut" varchar(20) NOT NULL DEFAULT 'EN_ATTENTE'
          CHECK ("statut" IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
        "montant_total" numeric(12,2) NOT NULL CHECK ("montant_total" >= 0),
        "devise" varchar(3) NOT NULL DEFAULT 'XOF',
        "expire_le" timestamptz,
        "client_id" integer NOT NULL REFERENCES "clients"("id"),
        "cree_par_id" integer REFERENCES "utilisateurs_personnel"("id"),
        "cree_le" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "lignes_reservation" (
        "id" SERIAL PRIMARY KEY,
        "reservation_id" integer NOT NULL
          REFERENCES "reservations"("id") ON DELETE CASCADE,
        "chambre_id" integer NOT NULL REFERENCES "chambres"("id"),
        "prix_par_nuit" numeric(12,2) NOT NULL CHECK ("prix_par_nuit" >= 0),
        "nombre_nuits" integer NOT NULL CHECK ("nombre_nuits" > 0),
        "sous_total" numeric(12,2) NOT NULL CHECK ("sous_total" >= 0),
        CONSTRAINT "uq_ligne_reservation_chambre"
          UNIQUE ("reservation_id", "chambre_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "journaux_audit" (
        "id" SERIAL PRIMARY KEY,
        "action" varchar(80) NOT NULL,
        "entite" varchar(80) NOT NULL,
        "entite_id" integer,
        "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "utilisateur_id" integer REFERENCES "utilisateurs_personnel"("id")
          ON DELETE SET NULL,
        "cree_le" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_chambres_statut" ON "chambres" ("statut")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_chambres_type_chambre" ON "chambres" ("type_chambre_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_reservations_dates_statut" ON "reservations" ("date_arrivee", "date_depart", "statut")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_reservations_client" ON "reservations" ("client_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_reservations_personnel" ON "reservations" ("cree_par_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_lignes_reservation_chambre" ON "lignes_reservation" ("chambre_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_journaux_audit_entite" ON "journaux_audit" ("entite", "entite_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_journaux_audit_utilisateur" ON "journaux_audit" ("utilisateur_id")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "journaux_audit"');
    await queryRunner.query('DROP TABLE "lignes_reservation"');
    await queryRunner.query('DROP TABLE "reservations"');
    await queryRunner.query('DROP TABLE "chambres"');
    await queryRunner.query('DROP TABLE "utilisateurs_personnel"');
    await queryRunner.query('DROP TABLE "clients"');
    await queryRunner.query('DROP TABLE "types_chambres"');
  }
}
