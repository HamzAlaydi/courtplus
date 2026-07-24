import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770385362235 implements MigrationInterface {
    name = 'Migrations1770385362235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."PayoutProvider" AS ENUM('stripe', 'custom')`);
        await queryRunner.query(`CREATE TABLE "tenant_payout_settings" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "provider" "public"."PayoutProvider" NOT NULL DEFAULT 'stripe', "providerAccountId" character varying, "isActive" boolean NOT NULL DEFAULT false, "bankName" character varying NOT NULL, "accountHolderName" character varying, "iban" character varying, "accountNumber" character varying, "sortCode" character varying, "swiftCode" character varying, "bankCountry" character varying(2), "metadata" jsonb, CONSTRAINT "PK_926f90db3ad7b132afbc363b341" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_360db6b9b2630d1d0109775931" ON "tenant_payout_settings" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "tenant_balances" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "availableBalance" double precision NOT NULL DEFAULT '0', "pendingBalance" double precision NOT NULL DEFAULT '0', "totalEarnings" double precision NOT NULL DEFAULT '0', "currency" character varying NOT NULL, CONSTRAINT "PK_722ae9ac64738456bed2eb9dde3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b60d94f222348085afaf0b4cdd" ON "tenant_balances" ("tenantId") `);
        await queryRunner.query(`CREATE TYPE "public"."PayoutStatus" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "payouts" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "amount" double precision NOT NULL, "currency" character varying NOT NULL, "status" "public"."PayoutStatus" NOT NULL DEFAULT 'pending', "provider" "public"."PayoutProvider" NOT NULL, "providerPayoutId" character varying, "requestedByStaffId" uuid NOT NULL, "sentAt" TIMESTAMP, "failureReason" text, "metadata" jsonb, CONSTRAINT "PK_76855dc4f0a6c18c72eea302e87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_73c7144469b0529f90a6d617c1" ON "payouts" ("providerPayoutId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f32ee6d2385d9a8bc0cc92af5" ON "payouts" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_4297ffd66fc80b89abf2124b2d" ON "payouts" ("tenantId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."TransactionType" AS ENUM('booking_completed', 'booking_refunded', 'payout_requested', 'payout_completed', 'payout_failed', 'adjustment', 'platform_fee')`);
        await queryRunner.query(`CREATE TABLE "balance_transactions" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "type" "public"."TransactionType" NOT NULL, "amount" double precision NOT NULL, "currency" character varying NOT NULL, "bookingId" uuid, "payoutId" uuid, "paymentId" uuid, "metadata" jsonb, CONSTRAINT "PK_6aea2d6b103d342d343be2ae93c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_59791f8aa72b034cfec084b9c6" ON "balance_transactions" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_a8c61376ee7563507a30b7c515" ON "balance_transactions" ("tenantId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "tenant_payout_settings" ADD CONSTRAINT "FK_360db6b9b2630d1d01097759319" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_balances" ADD CONSTRAINT "FK_b60d94f222348085afaf0b4cdd3" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payouts" ADD CONSTRAINT "FK_69a4f89f3dc6368abacabac085f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payouts" ADD CONSTRAINT "FK_148b57a5ea559d03d3678d0133e" FOREIGN KEY ("requestedByStaffId") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" ADD CONSTRAINT "FK_a67ed0038cf10119ae8bfeadfe3" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" ADD CONSTRAINT "FK_d0e451727428b776289fff5400d" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" ADD CONSTRAINT "FK_bda963be97c985f10a1dfe7a2d1" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" ADD CONSTRAINT "FK_c5f10ae7d80c42ca81e31c4e1d3" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance_transactions" DROP CONSTRAINT "FK_c5f10ae7d80c42ca81e31c4e1d3"`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" DROP CONSTRAINT "FK_bda963be97c985f10a1dfe7a2d1"`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" DROP CONSTRAINT "FK_d0e451727428b776289fff5400d"`);
        await queryRunner.query(`ALTER TABLE "balance_transactions" DROP CONSTRAINT "FK_a67ed0038cf10119ae8bfeadfe3"`);
        await queryRunner.query(`ALTER TABLE "payouts" DROP CONSTRAINT "FK_148b57a5ea559d03d3678d0133e"`);
        await queryRunner.query(`ALTER TABLE "payouts" DROP CONSTRAINT "FK_69a4f89f3dc6368abacabac085f"`);
        await queryRunner.query(`ALTER TABLE "tenant_balances" DROP CONSTRAINT "FK_b60d94f222348085afaf0b4cdd3"`);
        await queryRunner.query(`ALTER TABLE "tenant_payout_settings" DROP CONSTRAINT "FK_360db6b9b2630d1d01097759319"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8c61376ee7563507a30b7c515"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59791f8aa72b034cfec084b9c6"`);
        await queryRunner.query(`DROP TABLE "balance_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."TransactionType"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4297ffd66fc80b89abf2124b2d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f32ee6d2385d9a8bc0cc92af5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73c7144469b0529f90a6d617c1"`);
        await queryRunner.query(`DROP TABLE "payouts"`);
        await queryRunner.query(`DROP TYPE "public"."PayoutStatus"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b60d94f222348085afaf0b4cdd"`);
        await queryRunner.query(`DROP TABLE "tenant_balances"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_360db6b9b2630d1d0109775931"`);
        await queryRunner.query(`DROP TABLE "tenant_payout_settings"`);
        await queryRunner.query(`DROP TYPE "public"."PayoutProvider"`);
    }

}
