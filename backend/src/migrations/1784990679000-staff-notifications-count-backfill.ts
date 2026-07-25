import { MigrationInterface, QueryRunner } from "typeorm";

export class StaffNotificationsCountBackfill1784990679000 implements MigrationInterface {
    name = 'StaffNotificationsCountBackfill1784990679000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backfill the denormalized unseen counter from the actual unread
        // rows: rows created before the column existed have NULL, and
        // NULL + 1 stayed NULL, so their badge never moved.
        await queryRunner.query(`
            UPDATE "staff" s
            SET "notificationsCount" = sub.cnt
            FROM (
                SELECT "userId", COUNT(*)::int AS cnt
                FROM "notifications"
                WHERE "readAt" IS NULL
                GROUP BY "userId"
            ) sub
            WHERE s.id = sub."userId"
        `);
        await queryRunner.query(`
            UPDATE "staff"
            SET "notificationsCount" = 0
            WHERE "notificationsCount" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op: restoring previous counter values is not meaningful.
    }

}
