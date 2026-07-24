import { MigrationInterface, QueryRunner } from "typeorm";

export class SubsAndSuperAdmins1767525300019 implements MigrationInterface {
    name = 'SubsAndSuperAdmins1767525300019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'past_due', 'cancelled', 'unpaid', 'incomplete', 'incomplete_expired')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "providerSubscriptionId" character varying, "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'stripe', "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "quantity" integer NOT NULL DEFAULT '0', "pricePerUnit" numeric(10,2) NOT NULL DEFAULT '50', "currentPeriodStart" TIMESTAMP, "currentPeriodEnd" TIMESTAMP, "trialEndsAt" TIMESTAMP, "cancelledAt" TIMESTAMP, "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "metadata" jsonb, CONSTRAINT "REL_0c5fe8e5f9f4dd4a8c0134abc9" UNIQUE ("tenantId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "providerCustomerId" character varying`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'stripe'`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" DROP CONSTRAINT "FK_b3ca8df9ca2b559bdbfff07a052"`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ALTER COLUMN "tenantId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ADD CONSTRAINT "FK_b3ca8df9ca2b559bdbfff07a052" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_0c5fe8e5f9f4dd4a8c0134abc9c"`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" DROP CONSTRAINT "FK_b3ca8df9ca2b559bdbfff07a052"`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ALTER COLUMN "tenantId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staff_invitations" ADD CONSTRAINT "FK_b3ca8df9ca2b559bdbfff07a052" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "providerCustomerId"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    }

}
