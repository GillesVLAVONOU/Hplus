import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndisponibilitesChambres20261106010000 implements MigrationInterface {
  name = 'IndisponibilitesChambres20261106010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "indisponibilites_chambres" (
        "id" SERIAL PRIMARY KEY,
        "chambre_id" integer NOT NULL
          REFERENCES "chambres"("id") ON DELETE CASCADE,
        "cree_par_id" integer NOT NULL
          REFERENCES "utilisateurs_personnel"("id"),
        "date_debut" date NOT NULL,
        "date_fin" date NOT NULL,
        "motif" varchar(200) NOT NULL,
        "cree_le" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "ck_indisponibilites_chambres_dates"
          CHECK ("date_fin" > "date_debut")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_indisponibilites_chambres_dates"
      ON "indisponibilites_chambres" ("chambre_id", "date_debut", "date_fin")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "idx_indisponibilites_chambres_dates"');
    await queryRunner.query('DROP TABLE "indisponibilites_chambres"');
  }
}
