import { MigrationInterface, QueryRunner } from "typeorm";

export class Admins1766659502921 implements MigrationInterface {
    name = 'Admins1766659502921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ADD "blockedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "blockedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."StaffRole" RENAME TO "StaffRole_old"`);
        await queryRunner.query(`CREATE TYPE "public"."StaffRole" AS ENUM('SuperAdmin', 'Owner', 'Admin', 'User')`);
        await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "role" TYPE "public"."StaffRole" USING "role"::"text"::"public"."StaffRole"`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ALTER COLUMN "role" TYPE "public"."StaffRole" USING "role"::"text"::"public"."StaffRole"`);
        await queryRunner.query(`DROP TYPE "public"."StaffRole_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."StaffRole_old" AS ENUM('SuperAdmin', 'Admin', 'User')`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ALTER COLUMN "role" TYPE "public"."StaffRole_old" USING "role"::"text"::"public"."StaffRole_old"`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ALTER COLUMN "role" SET DEFAULT 'User'`);
        await queryRunner.query(`DROP TYPE "public"."StaffRole"`);
        await queryRunner.query(`ALTER TYPE "public"."StaffRole_old" RENAME TO "StaffRole"`);
        await queryRunner.query(`CREATE TYPE "public"."StaffRole_old" AS ENUM('SuperAdmin', 'Admin', 'User')`);
        await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "role" TYPE "public"."StaffRole_old" USING "role"::"text"::"public"."StaffRole_old"`);
        await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "role" SET DEFAULT 'SuperAdmin'`);
        await queryRunner.query(`DROP TYPE "public"."StaffRole"`);
        await queryRunner.query(`ALTER TYPE "public"."StaffRole_old" RENAME TO "StaffRole"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blockedAt"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "blockedAt"`);
    }

}
