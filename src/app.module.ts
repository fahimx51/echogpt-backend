import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersModule } from './users/users.module.js';


@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
