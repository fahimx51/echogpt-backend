import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service.js';
import { ChangePlanDto } from './dto/change-plan.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get('status')
    @ApiOperation({ summary: 'Get current subscription status' })
    @ApiResponse({ status: 200, description: 'Subscription status returned' })
    getStatus(@GetUser('userId') userId: string) {
        return this.subscriptionsService.getStatus(userId);
    }

    @Get('usage')
    @ApiOperation({ summary: 'Get remaining requests for current billing period' })
    @ApiResponse({ status: 200, description: 'Usage details returned' })
    getUsage(@GetUser('userId') userId: string) {
        return this.subscriptionsService.getUsage(userId);
    }

    @Patch('change-plan')
    @ApiOperation({ summary: 'Upgrade or downgrade subscription plan' })
    @ApiResponse({ status: 200, description: 'Plan changed successfully' })
    changePlan(@GetUser('userId') userId: string, @Body() dto: ChangePlanDto) {
        return this.subscriptionsService.changePlan(userId, dto.plan);
    }
}