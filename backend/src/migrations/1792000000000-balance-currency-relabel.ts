import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * tenant_balances rows created by a display read before the tenant had any
 * revenue carried a currency that did not match the tenant's courts, and the
 * service then refused every real booking credit as a currency mismatch.
 * Re-label balances that have never moved to the tenant's own currency.
 */
export class BalanceCurrencyRelabel1792000000000 implements MigrationInterface {
  name = 'BalanceCurrencyRelabel1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE tenant_balances b
      SET currency = COALESCE(
        (SELECT UPPER(p.currency) FROM tenant_preferences p WHERE p."tenantId" = b."tenantId" AND p.currency IS NOT NULL LIMIT 1),
        'SAR'
      )
      WHERE b."pendingBalance" = 0
        AND b."availableBalance" = 0
        AND b."totalEarnings" = 0
        AND NOT EXISTS (
          SELECT 1 FROM balance_transactions t
          WHERE t."tenantId" = b."tenantId" AND t.amount <> 0
        )
    `);
  }

  public async down(): Promise<void> {
    // Data relabel; nothing to restore.
  }
}
