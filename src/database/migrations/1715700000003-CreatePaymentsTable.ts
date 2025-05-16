import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable1715700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment type enum
    await queryRunner.query(`
      CREATE TYPE payment_type_enum AS ENUM (
        'rent',
        'deposit',
        'commission',
        'refund',
        'other'
      );
    `);

    // Create payment status enum
    await queryRunner.query(`
      CREATE TYPE payment_status_enum AS ENUM (
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled'
      );
    `);

    // Create payment method enum
    await queryRunner.query(`
      CREATE TYPE payment_method_enum AS ENUM (
        'bank_transfer',
        'cash',
        'mobile_money',
        'credit_card',
        'other'
      );
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        amount DECIMAL(10,2) NOT NULL,
        type payment_type_enum NOT NULL DEFAULT 'other',
        status payment_status_enum NOT NULL DEFAULT 'pending',
        method payment_method_enum NOT NULL DEFAULT 'bank_transfer',
        transaction_id VARCHAR(255),
        reference_number VARCHAR(255),
        notes TEXT,
        payer_id UUID NOT NULL REFERENCES users(id),
        payee_id UUID NOT NULL REFERENCES users(id),
        property_id UUID REFERENCES properties(id),
        due_date TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_payments_payer_id ON payments(payer_id);
      CREATE INDEX idx_payments_payee_id ON payments(payee_id);
      CREATE INDEX idx_payments_property_id ON payments(property_id);
      CREATE INDEX idx_payments_status ON payments(status);
      CREATE INDEX idx_payments_created_at ON payments(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payments;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_type_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method_enum;`);
  }
} 