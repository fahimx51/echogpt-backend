import { Module } from '@nestjs/common';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { AiProvidersModule } from '../ai-providers/ai-providers.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [AiProvidersModule, SubscriptionsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule { }