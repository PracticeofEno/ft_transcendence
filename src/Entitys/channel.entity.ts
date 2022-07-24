/*
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

const ChannelType = {
    PUBLIC: "public",
    PRIVATE: "private",
};

@Entity()
export class Channel extends BaseEntity {
  @PrimaryColumn()
  id : number;

  @Column()
  type : string;

  @Column()
  password: number;

  @Column()
  createdAt: number;

  @Column()
  updatedAt: boolean;

  @Column()
  avatarPath: string;

  @Column({nullable: true})
  twoFactorAuthenticationSecret: string;

  @Column({nullable: true})
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({nullable: true})
  lating: number;
}
*/