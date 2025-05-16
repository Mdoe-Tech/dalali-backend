import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTable1715700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create review_type_enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE review_type_enum AS ENUM ('property', 'user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create reviews table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type review_type_enum NOT NULL,
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        isVerified BOOLEAN DEFAULT false,
        reviewerId UUID NOT NULL REFERENCES users(id),
        reviewedUserId UUID REFERENCES users(id),
        propertyId UUID REFERENCES properties(id),
        createdAt TIMESTAMP NOT NULL DEFAULT now(),
        updatedAt TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Create indexes
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewerId);
        CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user_id ON reviews(reviewedUserId);
        CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(propertyId);
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reviews;`);
    await queryRunner.query(`DROP TYPE IF EXISTS review_type_enum;`);
  }
} 