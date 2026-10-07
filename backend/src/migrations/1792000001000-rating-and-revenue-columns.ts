import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * branches.avgRating was an INTEGER: the second review on a branch (average
 * 4.5) made the UPDATE fail and rolled the whole rating update back. Revenue
 * counters were integers too, so every fractional amount was truncated.
 */
export class RatingAndRevenueColumns1792000001000 implements MigrationInterface {
  name = 'RatingAndRevenueColumns1792000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "avgRating" TYPE double precision USING "avgRating"::double precision`);
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "totalRevenue" TYPE numeric(14,2) USING "totalRevenue"::numeric`);
    await queryRunner.query(`ALTER TABLE "courts" ALTER COLUMN "totalRevenue" TYPE numeric(14,2) USING "totalRevenue"::numeric`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "courts" ALTER COLUMN "totalRevenue" TYPE integer USING round("totalRevenue")::integer`);
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "totalRevenue" TYPE integer USING round("totalRevenue")::integer`);
    await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "avgRating" TYPE integer USING round("avgRating")::integer`);
  }
}
