import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Freeze the number of seats a split booking is divided by.
 *
 * The share was recomputed in three places — at creation from the invitee
 * list, in /pay from the participants attached at that moment, and again at
 * settlement from `participants.length`. Every join, decline, leave or
 * addition changed the denominator, so the amounts collected never added up
 * to the court price. Existing rows are backfilled from the participant count
 * (open matches from playersASide) so their arithmetic stays as it was.
 */
export class BookingSplitSeats1793000002000 implements MigrationInterface {
  name = 'BookingSplitSeats1793000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "splitSeats" integer`,
    );

    await queryRunner.query(`
      UPDATE "bookings" b
      SET "splitSeats" = GREATEST(
        2,
        CASE
          WHEN b."open" IS TRUE THEN COALESCE(b."playersASide", 1) * 2
          ELSE (SELECT COUNT(*) FROM "participants" p WHERE p."bookingId" = b."id")
        END
      )
      WHERE b."paymentType" = 'split' AND b."splitSeats" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "splitSeats"`,
    );
  }
}
