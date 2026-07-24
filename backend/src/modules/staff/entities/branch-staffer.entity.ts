import { Branch } from "src/modules/branches/entities/branch.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Staffer } from "./staff.entity";
import { BaseEntity } from "src/common/base-entity";

@Entity('branch_staffers')
@Index('idx_branch_id', ['branchId'])
@Index('idx_staffer_id', ['stafferId'])
export class BranchStaffer extends BaseEntity {

    @Column('uuid')
    branchId: string;

    @Column('uuid')
    stafferId: string;

    @ManyToOne(() => Branch, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'branchId' })
    branch: Branch;

    @ManyToOne(() => Staffer, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'stafferId' })
    staffer: Staffer;
}