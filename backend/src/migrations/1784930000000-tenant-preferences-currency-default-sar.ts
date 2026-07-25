import { MigrationInterface, QueryRunner } from "typeorm";

export class TenantPreferencesCurrencyDefaultSar1784930000000 implements MigrationInterface {
    name = 'TenantPreferencesCurrencyDefaultSar1784930000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_preferences" ALTER COLUMN "currency" SET DEFAULT 'SAR'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_preferences" ALTER COLUMN "currency" SET DEFAULT 'USD'`);
    }

}
