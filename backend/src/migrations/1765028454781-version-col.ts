import { MigrationInterface, QueryRunner } from "typeorm";

export class VersionCol1765028454781 implements MigrationInterface {
    name = 'VersionCol1765028454781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "rejectionReason"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "version" integer NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."ParticipantStatus" RENAME TO "ParticipantStatus_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ParticipantStatus" AS ENUM('pending_response', 'pending_payment', 'pending_approval', 'ready', 'entered', 'no_show', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "participants" ALTER COLUMN "status" TYPE "public"."ParticipantStatus" USING "status"::"text"::"public"."ParticipantStatus"`);
        await queryRunner.query(`DROP TYPE "public"."ParticipantStatus_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_eb224d6d3acf40220d84a63720" ON "notifications" ("userId", "readAt") `);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb224d6d3acf40220d84a63720"`);
        await queryRunner.query(`CREATE TYPE "public"."ParticipantStatus_old" AS ENUM('pending_response', 'pending_payment', 'pending_approval', 'ready', 'entered', 'rejected', 'no_show', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "participants" ALTER COLUMN "status" TYPE "public"."ParticipantStatus_old" USING "status"::"text"::"public"."ParticipantStatus_old"`);
        await queryRunner.query(`DROP TYPE "public"."ParticipantStatus"`);
        await queryRunner.query(`ALTER TYPE "public"."ParticipantStatus_old" RENAME TO "ParticipantStatus"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "participants" ADD "rejectionReason" character varying`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
