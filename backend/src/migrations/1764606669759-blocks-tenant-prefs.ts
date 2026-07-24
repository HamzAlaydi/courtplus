import { MigrationInterface, QueryRunner } from "typeorm";

export class BlocksTenantPrefs1764606669759 implements MigrationInterface {
    name = 'BlocksTenantPrefs1764606669759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenant_preferences" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "currency" character varying NOT NULL DEFAULT 'USD', "tenantId" uuid NOT NULL, CONSTRAINT "REL_fbebe7889696136faf467add7c" UNIQUE ("tenantId"), CONSTRAINT "PK_a0f34ab248653621bf40a9c638c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blocks" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blockerId" uuid NOT NULL, "blockedId" uuid NOT NULL, CONSTRAINT "unique_block" UNIQUE ("blockerId", "blockedId"), CONSTRAINT "PK_8244fa1495c4e9222a01059244b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_block_created" ON "blocks" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_block_blockedId" ON "blocks" ("blockedId") `);
        await queryRunner.query(`CREATE INDEX "idx_block_blockerId" ON "blocks" ("blockerId") `);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f3603eefe93786a735bd9689e"`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ADD CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef19dfa50221762de8ce35b043"`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old"`);
        await queryRunner.query(`CREATE TYPE "public"."NotificationType" AS ENUM('follow', 'booking_cancelled', 'booking_invitation_accepted', 'booking_invitation_rejected', 'booking_reminder', 'booking_invitation', 'booking_entered', 'booking_joined', 'booking_created', 'booking_participant_removed', 'booking_participant_added', 'booking_participant_cancelled', 'booking_started', 'booking_ended', 'booking_join_request_submitted', 'booking_join_request_approved', 'booking_join_request_rejected', 'review_added', 'payment_failed', 'payment_succeeded', 'refund_succeeded', 'refund_failed', 'payment_released', 'moment_posted', 'post_like', 'report_created')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."NotificationType" USING "type"::"text"::"public"."NotificationType"`);
        await queryRunner.query(`DROP TYPE "public"."NotificationType_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5f3603eefe93786a735bd9689e" ON "user_preferences" ("userId", "deviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef19dfa50221762de8ce35b043" ON "notifications" ("userId", "type") `);
        await queryRunner.query(`ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_preferences" ADD CONSTRAINT "FK_fbebe7889696136faf467add7c8" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "FK_ed8a33b2c1ac10922c2354f5cfc" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blocks" ADD CONSTRAINT "FK_b87401da081a7153ec3bd1e6ab6" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_b87401da081a7153ec3bd1e6ab6"`);
        await queryRunner.query(`ALTER TABLE "blocks" DROP CONSTRAINT "FK_ed8a33b2c1ac10922c2354f5cfc"`);
        await queryRunner.query(`ALTER TABLE "tenant_preferences" DROP CONSTRAINT "FK_fbebe7889696136faf467add7c8"`);
        await queryRunner.query(`ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef19dfa50221762de8ce35b043"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f3603eefe93786a735bd9689e"`);
        await queryRunner.query(`CREATE TYPE "public"."NotificationType_old" AS ENUM('follow', 'booking_cancelled', 'booking_invitation_accepted', 'booking_invitation_rejected', 'booking_reminder', 'booking_invitation', 'booking_entered', 'booking_joined', 'booking_created', 'booking_participant_removed', 'booking_participant_added', 'booking_participant_cancelled', 'booking_started', 'booking_ended', 'booking_join_request_submitted', 'booking_join_request_approved', 'booking_join_request_rejected', 'review_added', 'payment_failed', 'payment_succeeded', 'refund_succeeded', 'refund_failed', 'moment_posted', 'post_like', 'report_created')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."NotificationType_old" USING "type"::"text"::"public"."NotificationType_old"`);
        await queryRunner.query(`DROP TYPE "public"."NotificationType"`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType_old" RENAME TO "NotificationType"`);
        await queryRunner.query(`CREATE INDEX "IDX_ef19dfa50221762de8ce35b043" ON "notifications" ("type", "userId") `);
        await queryRunner.query(`ALTER TABLE "user_preferences" DROP CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5f3603eefe93786a735bd9689e" ON "user_preferences" ("userId", "deviceId") `);
        await queryRunner.query(`DROP INDEX "public"."idx_block_blockerId"`);
        await queryRunner.query(`DROP INDEX "public"."idx_block_blockedId"`);
        await queryRunner.query(`DROP INDEX "public"."idx_block_created"`);
        await queryRunner.query(`DROP TABLE "blocks"`);
        await queryRunner.query(`DROP TABLE "tenant_preferences"`);
    }

}
