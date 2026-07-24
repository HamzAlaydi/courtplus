import { MigrationInterface, QueryRunner } from "typeorm";

export class StaffNotificationsCount1764152660899 implements MigrationInterface {
    name = 'StaffNotificationsCount1764152660899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff" ADD "notificationsCount" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN "notificationsCount"`);
    }

}
