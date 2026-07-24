import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentStatus1764699484366 implements MigrationInterface {
    name = 'PaymentStatus1764699484366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old"`);
        await queryRunner.query(`CREATE TYPE "public"."PaymentStatus" AS ENUM('pending', 'completed', 'failed', 'refunded', 'partially_paid', 'hold', 'released', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."PaymentStatus" USING "status"::"text"::"public"."PaymentStatus"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" TYPE "public"."PaymentStatus" USING "paymentStatus"::"text"::"public"."PaymentStatus"`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."PaymentStatus_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."PaymentStatus_old" AS ENUM('pending', 'completed', 'failed', 'refunded', 'partially_paid', 'hold', 'released')`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" TYPE "public"."PaymentStatus_old" USING "paymentStatus"::"text"::"public"."PaymentStatus_old"`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "paymentStatus" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."PaymentStatus"`);
        await queryRunner.query(`ALTER TYPE "public"."PaymentStatus_old" RENAME TO "PaymentStatus"`);
        await queryRunner.query(`CREATE TYPE "public"."PaymentStatus_old" AS ENUM('pending', 'completed', 'failed', 'refunded', 'partially_paid', 'hold', 'released')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."PaymentStatus_old" USING "status"::"text"::"public"."PaymentStatus_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."PaymentStatus"`);
        await queryRunner.query(`ALTER TYPE "public"."PaymentStatus_old" RENAME TO "PaymentStatus"`);
    }

}
