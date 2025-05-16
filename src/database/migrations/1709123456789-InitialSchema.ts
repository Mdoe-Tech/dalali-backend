import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709123456789 implements MigrationInterface {
  name = 'InitialSchema1709123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('tenant', 'owner', 'dalali', 'admin')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'tenant',
        "phoneNumber" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."property_type_enum" AS ENUM('house', 'apartment', 'land', 'commercial')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."property_status_enum" AS ENUM('available', 'rented', 'sold', 'pending')
    `);

    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "type" "public"."property_type_enum" NOT NULL,
        "status" "public"."property_status_enum" NOT NULL DEFAULT 'available',
        "price" decimal(10,2) NOT NULL,
        "location" character varying NOT NULL,
        "latitude" decimal(10,6),
        "longitude" decimal(10,6),
        "bedrooms" integer NOT NULL,
        "bathrooms" integer NOT NULL,
        "area" decimal(10,2) NOT NULL,
        "features" text[],
        "images" text[],
        "ownerId" uuid NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_properties" PRIMARY KEY ("id"),
        CONSTRAINT "FK_properties_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_properties_type" ON "properties" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_properties_status" ON "properties" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_properties_location" ON "properties" ("location")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_properties_location"`);
    await queryRunner.query(`DROP INDEX "IDX_properties_status"`);
    await queryRunner.query(`DROP INDEX "IDX_properties_type"`);
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(`DROP TYPE "public"."property_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."property_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
} 