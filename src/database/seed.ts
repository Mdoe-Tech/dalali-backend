import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: false,
});

const users = [
  {
    email: 'admin@dalali.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'admin123',
    role: UserRole.ADMIN,
  },
  {
    email: 'dalali@dalali.com',
    firstName: 'Dalali',
    lastName: 'Agent',
    password: 'dalali123',
    role: UserRole.DALALI,
  },
  {
    email: 'owner@dalali.com',
    firstName: 'Owner',
    lastName: 'Property',
    password: 'owner123',
    role: UserRole.OWNER,
  },
  {
    email: 'tenant@dalali.com',
    firstName: 'Tenant',
    lastName: 'Renter',
    password: 'tenant123',
    role: UserRole.TENANT,
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);
    for (const userData of users) {
      const exists = await userRepo.findOne({ where: { email: userData.email } });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = userRepo.create({ ...userData, password: hashedPassword });
        await userRepo.save(user);
        console.log(`Seeded user: ${user.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }
    await AppDataSource.destroy();
    console.log('Seeding completed.');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed(); 