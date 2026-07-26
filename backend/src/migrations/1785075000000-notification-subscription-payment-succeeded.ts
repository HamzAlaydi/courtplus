import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The NotificationType enum value 'subscription_payment_succeeded' was added to
 * the entity but never to the database enum. Every invoice.paid webhook then
 * crashed inside handleInvoicePaid when inserting the success notification
 * (invalid input value for enum), so Stripe kept retrying and, critically,
 * activatePendingCourts() after the notification never ran — paid courts
 * stayed pending_payment and ops was never notified.
 */
export class NotificationSubscriptionPaymentSucceeded1785075000000 implements MigrationInterface {
    name = 'NotificationSubscriptionPaymentSucceeded1785075000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'subscription_payment_succeeded'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres enum values cannot be removed; documented no-op.
    }
}
