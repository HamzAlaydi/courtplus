import { MigrationInterface, QueryRunner } from "typeorm";

export class RateReminderNotificationType1785006117000 implements MigrationInterface {
    name = 'RateReminderNotificationType1785006117000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'rate_reminder'`);
    }

    public async down(): Promise<void> {
        // Postgres enum values cannot be removed; no-op.
    }

}
