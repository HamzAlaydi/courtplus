import { MigrationInterface, QueryRunner } from "typeorm";

export class CourtModerationOpsAudit1784930000000 implements MigrationInterface {
    name = 'CourtModerationOpsAudit1784930000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."CourtStatus" ADD VALUE IF NOT EXISTS 'pending_payment'`);
        await queryRunner.query(`ALTER TYPE "public"."CourtStatus" ADD VALUE IF NOT EXISTS 'pending_approval'`);
        await queryRunner.query(`ALTER TYPE "public"."CourtStatus" ADD VALUE IF NOT EXISTS 'changes_requested'`);
        await queryRunner.query(`ALTER TYPE "public"."CourtStatus" ADD VALUE IF NOT EXISTS 'suspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_pending_payment'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_pending_approval'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_approved'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_changes_requested'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_resubmitted'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_suspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'court_unsuspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'branch_suspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'branch_unsuspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'tenant_suspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'tenant_unsuspended'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'tenant_unsuspend_requested'`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'subscription_payment_failed'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'court'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'branch'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'tenant'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'staff'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'subscription'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'ops_admin'`);
        await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'unsuspend_request'`);
        await queryRunner.query(`ALTER TABLE "courts" ADD "rejectionReason" text`);
        await queryRunner.query(`ALTER TABLE "courts" ADD "submittedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "courts" ADD "reviewedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "courts" ADD "reviewedByStaffId" uuid`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "suspendedReason" text`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "suspendedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "blockedReason" text`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "actorStaffId" uuid`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "actorEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "ip" character varying`);
        await queryRunner.query(`ALTER TABLE "logs" ADD "userAgent" character varying`);
        await queryRunner.query(`CREATE TABLE "unsuspend_requests" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "message" text NOT NULL, "resolvedAt" TIMESTAMP, CONSTRAINT "PK_unsuspend_requests" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "unsuspend_request_tenant_id_idx" ON "unsuspend_requests" ("tenantId") `);
        await queryRunner.query(`ALTER TABLE "unsuspend_requests" ADD CONSTRAINT "FK_unsuspend_requests_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres enum values cannot be dropped; the enum extensions are left in place on revert.
        await queryRunner.query(`ALTER TABLE "unsuspend_requests" DROP CONSTRAINT "FK_unsuspend_requests_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."unsuspend_request_tenant_id_idx"`);
        await queryRunner.query(`DROP TABLE "unsuspend_requests"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "userAgent"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "ip"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "actorEmail"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP COLUMN "actorStaffId"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "blockedReason"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "suspendedAt"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "suspendedReason"`);
        await queryRunner.query(`ALTER TABLE "courts" DROP COLUMN "reviewedByStaffId"`);
        await queryRunner.query(`ALTER TABLE "courts" DROP COLUMN "reviewedAt"`);
        await queryRunner.query(`ALTER TABLE "courts" DROP COLUMN "submittedAt"`);
        await queryRunner.query(`ALTER TABLE "courts" DROP COLUMN "rejectionReason"`);
    }

}
