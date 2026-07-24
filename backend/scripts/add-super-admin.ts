import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { hashPassword } from '../src/modules/auth/util/password';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

async function main() {
  const email = 'm.maged@pointseven.net';
  const password = process.argv[2] || process.env.SUPER_ADMIN_PASSWORD;

  if (!password) {
    console.error(
      'Error: super-admin password is required. Pass it as a CLI argument ' +
        'or set the SUPER_ADMIN_PASSWORD env var. Refusing to seed an empty password.',
    );
    process.exit(1);
  }

  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();

  const existing = await queryRunner.manager
    .createQueryBuilder()
    .select('staff.id')
    .from('staff', 'staff')
    .where('staff.email = :email', { email })
    .andWhere('staff."deletedAt" IS NULL')
    .getRawOne();

  if (existing) {
    console.log('Staff member already exists with this email');
    await queryRunner.release();
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await hashPassword(password);

  await queryRunner.manager
    .createQueryBuilder()
    .insert()
    .into('staff')
    .values({
      email,
      password: hashedPassword,
      role: 'SuperAdmin',
      verifiedAt: new Date(),
    })
    .execute();

  console.log('Super Admin staff member created successfully');
  console.log('Email:', email);

  await queryRunner.release();
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
