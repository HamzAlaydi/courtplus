import { MigrationInterface, QueryRunner } from "typeorm";

export class CourtsUpcomingBookings1785024000000 implements MigrationInterface {
    name = 'CourtsUpcomingBookings1785024000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courts" ADD "upcomingBookings" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courts" DROP COLUMN "upcomingBookings"`);
    }

}
