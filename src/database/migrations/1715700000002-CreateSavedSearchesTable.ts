import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSavedSearchesTable1715700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "saved_searches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "searchCriteria" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "notifyOnNewMatch" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastNotifiedAt" TIMESTAMP,
        CONSTRAINT "PK_saved_searches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_saved_searches_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_searches_userId" ON "saved_searches" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_saved_searches_createdAt" ON "saved_searches" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_saved_searches_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_saved_searches_userId"`);
    await queryRunner.query(`DROP TABLE "saved_searches"`);
  }
} 