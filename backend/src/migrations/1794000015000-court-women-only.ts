import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Courts gain a "women only" flag (fully enclosed and private) that customers
 * can filter on. Existing rows default to false so nothing is advertised as
 * women only until the vendor says so.
 */
export class CourtWomenOnly1794000015000 implements MigrationInterface {
  name = 'CourtWomenOnly1794000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courts" ADD COLUMN IF NOT EXISTS "isWomenOnly" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courts" DROP COLUMN IF EXISTS "isWomenOnly"`,
    );
  }
}
