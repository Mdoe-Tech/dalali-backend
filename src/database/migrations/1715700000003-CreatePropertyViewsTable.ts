import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePropertyViewsTable1715700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE property_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "propertyId" UUID NOT NULL,
        "userId" UUID,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_property FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE CASCADE,
        CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX idx_property_views_property ON property_views("propertyId");
      CREATE INDEX idx_property_views_user ON property_views("userId");
      CREATE INDEX idx_property_views_created ON property_views("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_property_views_created;
      DROP INDEX IF EXISTS idx_property_views_user;
      DROP INDEX IF EXISTS idx_property_views_property;
      DROP TABLE IF EXISTS property_views;
    `);
  }
} 