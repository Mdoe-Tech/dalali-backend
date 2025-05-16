import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDalaliIdToProperties1715700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE properties
      ADD COLUMN "dalaliId" uuid,
      ADD CONSTRAINT "fk_properties_dalali"
      FOREIGN KEY ("dalaliId")
      REFERENCES users(id)
      ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE properties
      DROP CONSTRAINT "fk_properties_dalali",
      DROP COLUMN "dalaliId";
    `);
  }
} 