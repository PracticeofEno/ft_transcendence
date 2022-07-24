import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { typeORMConfig } from './configs/typeorm.config';
import { TypeOrmExModule } from './database/typeorm-ex-module';
import { EventsModule } from './events/events.module';
import { UserRepository } from './users/user.repository';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule, 
    TypeOrmModule.forRoot(typeORMConfig), 
    UsersModule,
    TypeOrmExModule.forCustomRepository([UserRepository]),
    EventsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
