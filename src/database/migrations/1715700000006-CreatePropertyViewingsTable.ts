import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePropertyViewingsTable1715700000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE viewing_status_enum AS ENUM (
        'pending',
        'confirmed',
        'cancelled',
        'completed',
        'no_show'
      );

      CREATE TABLE property_viewings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "propertyId" UUID NOT NULL,
        "tenantId" UUID NOT NULL,
        "scheduledDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        duration INTEGER NOT NULL,
        status viewing_status_enum NOT NULL DEFAULT 'pending',
        notes TEXT,
        "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
        "cancellationReason" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_viewing_property FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE CASCADE,
        CONSTRAINT fk_viewing_tenant FOREIGN KEY ("tenantId") REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_viewings_property ON property_viewings("propertyId");
      CREATE INDEX idx_viewings_tenant ON property_viewings("tenantId");
      CREATE INDEX idx_viewings_scheduled ON property_viewings("scheduledDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_viewings_scheduled;
      DROP INDEX IF EXISTS idx_viewings_tenant;
      DROP INDEX IF EXISTS idx_viewings_property;
      DROP TABLE IF EXISTS property_viewings;
      DROP TYPE IF EXISTS viewing_status_enum;
    `);
  }
} 