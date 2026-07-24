import { MigrationInterface, QueryRunner } from "typeorm";

export class TempSlots1765546067728 implements MigrationInterface {
    name = 'TempSlots1765546067728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "slot_reservations" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL, "courtId" uuid NOT NULL, "userId" uuid NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_377e20398ec230ff16a02cdd00e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "slot_reservation_expires_idx" ON "slot_reservations" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "slot_reservation_court_dates_idx" ON "slot_reservations" ("courtId", "startDate", "endDate") `);
        await queryRunner.query(`ALTER TABLE "slot_reservations" ADD CONSTRAINT "FK_5bdc29d9de790b3c1793446775c" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "slot_reservations" DROP CONSTRAINT "FK_5bdc29d9de790b3c1793446775c"`);
        await queryRunner.query(`DROP INDEX "public"."slot_reservation_court_dates_idx"`);
        await queryRunner.query(`DROP INDEX "public"."slot_reservation_expires_idx"`);
        await queryRunner.query(`DROP TABLE "slot_reservations"`);
    }

}
