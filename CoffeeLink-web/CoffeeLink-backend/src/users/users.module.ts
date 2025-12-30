import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [PrismaService], // Can add UsersService later for logic
})
export class UsersModule {}
