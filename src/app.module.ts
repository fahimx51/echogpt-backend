import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';


@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
