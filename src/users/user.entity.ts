import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Story } from '../stories/entities/story.entity';
import { OneToMany } from 'typeorm';


export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERUSER = 'superuser',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  username: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'varchar', length: 1, default: 'N' }) // ✅ Default set to "N"
  superuserRole: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @Column({ nullable: true })
  profilePicture: string;
  @OneToMany(() => Story, (story) => story.author)
  stories: Story[];
}
