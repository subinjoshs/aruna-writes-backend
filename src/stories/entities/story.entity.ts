import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 100 })
  authorName: string;

  @ManyToOne(() => User, (user) => user.stories, { onDelete: 'CASCADE' }) // Foreign key
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
   // ✅ New Field: Comments (JSON format for storing multiple comments)
   @Column({ type: 'json', nullable: true, default: [] })
   comments: { userId: number; comment: string; createdAt: Date }[];
 
   // ✅ New Field: Views (Integer count)
   @Column({ type: 'int', default: 0 })
   views: number;
}
