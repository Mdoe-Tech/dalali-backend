import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});

async function setup() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Drop existing tables and types
    await AppDataSource.query(`
      DROP TABLE IF EXISTS properties CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TYPE IF EXISTS user_role_enum CASCADE;
      DROP TYPE IF EXISTS property_type_enum CASCADE;
      DROP TYPE IF EXISTS property_status_enum CASCADE;
    `);
    console.log('Dropped existing tables and types');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully');

    await AppDataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

setup(); 