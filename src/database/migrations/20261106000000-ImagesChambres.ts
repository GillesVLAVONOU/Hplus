import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImagesChambres20261106000000 implements MigrationInterface {
  name = 'ImagesChambres20261106000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chambres"
      ADD COLUMN "images" text[] NOT NULL DEFAULT '{}'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chambres" DROP COLUMN "images"');
  }
}
