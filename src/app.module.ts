import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { AiProvidersModule } from './ai-providers/ai-providers.module.js';


@Module({
  imports: [PrismaModule, UsersModule, AuthModule, SubscriptionsModule, AiProvidersModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
