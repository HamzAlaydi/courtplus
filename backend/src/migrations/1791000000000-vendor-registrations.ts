import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vendor self-registration from the marketing site.
 *
 * The landing form previously emailed Court+'s inbox and stored nothing, so a
 * lead that was spam-filed or deleted was gone with no way to recover it. This
 * table is the durable record: it also carries the business details the owner
 * typed (facility name, phone, city) from the moment they submit the form
 * until they redeem the emailed link, so the tenant can be seeded with them
 * instead of asking for the same information twice.
 *
 * The auth token itself is NOT here — it lives on staff_invitations, reusing
 * the existing hashed-token, single-use, 7-day mechanism rather than adding a
 * second one.
 */
export class VendorRegistrations1791000000000 implements MigrationInterface {
  name = 'VendorRegistrations1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "VendorRegistrationStatus" AS ENUM ('pending', 'completed', 'superseded');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_registrations" (
        "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email"        character varying NOT NULL,
        "firstName"    character varying NOT NULL,
        "lastName"     character varying,
        "facilityName" character varying NOT NULL,
        "phoneNumber"  character varying,
        "city"         character varying,
        "status"       "VendorRegistrationStatus" NOT NULL DEFAULT 'pending',
        "invitationId" uuid,
        "tenantId"     uuid,
        "completedAt"  TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_vendor_registrations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vendor_registration_email"
        ON "vendor_registrations" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vendor_registration_status"
        ON "vendor_registrations" ("status")
    `);
    // Looked up by invitation when the vendor redeems their link.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vendor_registration_invitationId"
        ON "vendor_registrations" ("invitationId")
    `);

    // SET NULL rather than CASCADE: losing the invitation must never delete
    // the lead record, which is the whole point of this table.
    await queryRunner.query(`
      ALTER TABLE "vendor_registrations"
        ADD CONSTRAINT "FK_vendor_registration_invitation"
        FOREIGN KEY ("invitationId") REFERENCES "staff_invitations"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vendor_registrations"
        DROP CONSTRAINT IF EXISTS "FK_vendor_registration_invitation"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_registrations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "VendorRegistrationStatus"`);
  }
}
