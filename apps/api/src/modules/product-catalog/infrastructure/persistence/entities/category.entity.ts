import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * CategoryEntity (TypeORM)
 *
 * Persistence model for Category aggregate root.
 * Maps domain aggregate to database table.
 */
@Entity('categories')
@Index(['slug'], { unique: true })
@Index(['parentId'])
@Index(['isActive'])
@Index(['displayOrder'])
export class CategoryEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ unique: true, length: 200 })
  slug!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('uuid', { nullable: true })
  parentId!: string | null;

  @Column('int', { default: 0 })
  displayOrder!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
