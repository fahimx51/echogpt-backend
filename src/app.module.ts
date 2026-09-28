import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { AiProvidersModule } from './ai-providers/ai-providers.module.js';
import { ChatModule } from './chat/chat.module.js';
import { SearchModule } from './search/search.module.js';
import { AdminModule } from './admin/admin.module.js';
import { UsageLogInterceptor } from './common/interceptors/usage-log.interceptor.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    SubscriptionsModule,
    AiProvidersModule,
    ChatModule,
    SearchModule,
    AdminModule,
    RedisModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: UsageLogInterceptor,
    },
  ],
})
export class AppModule { }