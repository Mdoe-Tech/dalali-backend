import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesTable1715700000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file');
      CREATE TYPE message_status_enum AS ENUM ('sent', 'delivered', 'read');

      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "senderId" UUID NOT NULL,
        "receiverId" UUID NOT NULL,
        type message_type_enum NOT NULL DEFAULT 'text',
        content TEXT NOT NULL,
        status message_status_enum NOT NULL DEFAULT 'sent',
        "fileUrl" VARCHAR(255),
        "fileName" VARCHAR(255),
        "fileSize" INTEGER,
        "fileType" VARCHAR(100),
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_message_sender FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_message_receiver FOREIGN KEY ("receiverId") REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_messages_sender ON messages("senderId");
      CREATE INDEX idx_messages_receiver ON messages("receiverId");
      CREATE INDEX idx_messages_created ON messages("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_messages_created;
      DROP INDEX IF EXISTS idx_messages_receiver;
      DROP INDEX IF EXISTS idx_messages_sender;
      DROP TABLE IF EXISTS messages;
      DROP TYPE IF EXISTS message_status_enum;
      DROP TYPE IF EXISTS message_type_enum;
    `);
  }
} 