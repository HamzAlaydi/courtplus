import { MigrationInterface, QueryRunner } from "typeorm";

export class StaffAccountDeletion1765110079488 implements MigrationInterface {
    name = 'StaffAccountDeletion1765110079488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "verifications" DROP CONSTRAINT "idx_verification_context"`);
        await queryRunner.query(`ALTER TYPE "public"."VerificationContext" RENAME TO "VerificationContext_old"`);
        await queryRunner.query(`CREATE TYPE "public"."VerificationContext" AS ENUM('account_verification', 'password_reset', 'email_verification', 'account_deletion')`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "context" TYPE "public"."VerificationContext" USING "context"::"text"::"public"."VerificationContext"`);
        await queryRunner.query(`DROP TYPE "public"."VerificationContext_old"`);
        await queryRunner.query(`ALTER TABLE "verifications" ADD CONSTRAINT "idx_verification_context" UNIQUE ("userId", "context")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verifications" DROP CONSTRAINT "idx_verification_context"`);
        await queryRunner.query(`CREATE TYPE "public"."VerificationContext_old" AS ENUM('account_verification', 'password_reset', 'email_verification')`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "context" TYPE "public"."VerificationContext_old" USING "context"::"text"::"public"."VerificationContext_old"`);
        await queryRunner.query(`DROP TYPE "public"."VerificationContext"`);
        await queryRunner.query(`ALTER TYPE "public"."VerificationContext_old" RENAME TO "VerificationContext"`);
        await queryRunner.query(`ALTER TABLE "verifications" ADD CONSTRAINT "idx_verification_context" UNIQUE ("context", "userId")`);
        await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN "deletedAt"`);
    }

}
