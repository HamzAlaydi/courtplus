import { MigrationInterface, QueryRunner } from "typeorm";

export class UserCoverUrl1784923018000 implements MigrationInterface {
    name = 'UserCoverUrl1784923018000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "coverUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "coverUrl"`);
    }

}
