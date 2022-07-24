import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn()
  id : string;

  @Column()
  nickname : string;

  @Column()
  win: number;

  @Column()
  lose: number;

  @Column()
  admin: boolean;

  @Column()
  avatarPath: string;

  @Column({nullable: true})
  twoFactorAuthenticationSecret: string;

  @Column({nullable: true})
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({nullable: true})
  lating: number;
}
