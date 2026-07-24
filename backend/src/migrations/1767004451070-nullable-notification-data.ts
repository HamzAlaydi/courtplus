import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableNotificationData1767004451070 implements MigrationInterface {
    name = 'NullableNotificationData1767004451070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "data" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "data" SET NOT NULL`);
    }

}
