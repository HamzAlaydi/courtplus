import { MigrationInterface, QueryRunner } from "typeorm";

export class HoldAmountDecimal1764148173942 implements MigrationInterface {
    name = 'HoldAmountDecimal1764148173942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "holdAmount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "holdAmount" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "holdAmount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "holdAmount" integer`);
    }

}
