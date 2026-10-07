import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Courts gain an "air conditioned" flag that customers can filter on. Existing
 * rows default to false so nothing is advertised as air conditioned until the
 * vendor says so.
 */
export class CourtAirConditioned1794000014000 implements MigrationInterface {
  name = 'CourtAirConditioned1794000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courts" ADD COLUMN IF NOT EXISTS "isAirConditioned" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courts" DROP COLUMN IF EXISTS "isAirConditioned"`,
    );
  }
}
