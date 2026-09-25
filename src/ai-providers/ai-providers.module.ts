import { Module } from '@nestjs/common';
import { AiProvidersService } from './ai-providers.service.js';
import { AiProvidersController } from './ai-providers.controller.js';

@Module({
  providers: [AiProvidersService],
  controllers: [AiProvidersController]
})
export class AiProvidersModule {}
