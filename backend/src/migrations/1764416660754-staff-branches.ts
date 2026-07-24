import { MigrationInterface, QueryRunner } from "typeorm";

export class StaffBranches1764416660754 implements MigrationInterface {
    name = 'StaffBranches1764416660754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branch_staffers" DROP CONSTRAINT "FK_4533af12fe318cf3d7ed7525dd9"`);
        await queryRunner.query(`ALTER TABLE "branch_staffers" DROP CONSTRAINT "FK_d772db841d875a2e7e617d6c53e"`);
        await queryRunner.query(`ALTER TABLE "branch_staffers" ADD CONSTRAINT "FK_d772db841d875a2e7e617d6c53e" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_staffers" ADD CONSTRAINT "FK_4533af12fe318cf3d7ed7525dd9" FOREIGN KEY ("stafferId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branch_staffers" DROP CONSTRAINT "FK_4533af12fe318cf3d7ed7525dd9"`);
        await queryRunner.query(`ALTER TABLE "branch_staffers" DROP CONSTRAINT "FK_d772db841d875a2e7e617d6c53e"`);
        await queryRunner.query(`ALTER TABLE "branch_staffers" ADD CONSTRAINT "FK_d772db841d875a2e7e617d6c53e" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_staffers" ADD CONSTRAINT "FK_4533af12fe318cf3d7ed7525dd9" FOREIGN KEY ("stafferId") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
