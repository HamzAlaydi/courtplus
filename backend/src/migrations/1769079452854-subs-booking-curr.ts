import { MigrationInterface, QueryRunner } from "typeorm";

export class SubsBookingCurr1769079452854 implements MigrationInterface {
    name = 'SubsBookingCurr1769079452854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "trialEndsAt"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "cancelAtPeriodEnd"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "currency" character varying NOT NULL DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "providerCustomerId" character varying`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "providerPriceId" character varying`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "paymentProvider" "public"."PaymentProvider" NOT NULL DEFAULT 'stripe'`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum" RENAME TO "subscriptions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'past_due', 'cancelled', 'unpaid')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" USING "status"::"text"::"public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum_old" AS ENUM('active', 'past_due', 'cancelled', 'unpaid', 'incomplete', 'incomplete_expired')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum_old" USING "status"::"text"::"public"."subscriptions_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum_old" RENAME TO "subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "paymentProvider"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "providerPriceId"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "providerCustomerId"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'stripe'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "trialEndsAt" TIMESTAMP`);
    }

}
