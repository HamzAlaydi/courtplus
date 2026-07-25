import { MigrationInterface, QueryRunner } from "typeorm";

export class CourtsSizeLocationNullable1785009219608 implements MigrationInterface {
    name = 'CourtsSizeLocationNullable1785009219608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courts" ALTER COLUMN "size" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courts" ALTER COLUMN "locationId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courts" ALTER COLUMN "locationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courts" ALTER COLUMN "size" SET NOT NULL`);
    }

}
