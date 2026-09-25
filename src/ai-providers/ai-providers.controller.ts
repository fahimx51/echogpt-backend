import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiProvidersService } from './ai-providers.service.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';
import { UpdateProviderDto } from './dto/update-provider.dto.js';
import { ToggleEnabledDto } from './dto/toggle-enabled.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@ApiTags('AI Providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-providers')
export class AiProvidersController {
    constructor(private readonly aiProvidersService: AiProvidersService) { }

    @Post()
    @ApiOperation({ summary: 'Add a new AI provider configuration' })
    @ApiResponse({ status: 201, description: 'Provider added' })
    @ApiResponse({ status: 409, description: 'Provider already exists for this user' })
    create(@GetUser('userId') userId: string, @Body() dto: CreateProviderDto) {
        return this.aiProvidersService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all configured AI providers' })
    @ApiResponse({ status: 200, description: 'Providers returned' })
    findAll(@GetUser('userId') userId: string) {
        return this.aiProvidersService.findAll(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single AI provider by ID' })
    @ApiResponse({ status: 200, description: 'Provider returned' })
    @ApiResponse({ status: 404, description: 'Provider not found' })
    findOne(@GetUser('userId') userId: string, @Param('id') id: string) {
        return this.aiProvidersService.findOne(userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update (rotate) an AI provider API key' })
    @ApiResponse({ status: 200, description: 'Provider updated' })
    update(
        @GetUser('userId') userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateProviderDto,
    ) {
        return this.aiProvidersService.update(userId, id, dto);
    }

    @Patch(':id/toggle')
    @ApiOperation({ summary: 'Enable or disable an AI provider' })
    @ApiResponse({ status: 200, description: 'Provider status updated' })
    toggle(
        @GetUser('userId') userId: string,
        @Param('id') id: string,
        @Body() dto: ToggleEnabledDto,
    ) {
        return this.aiProvidersService.setEnabled(userId, id, dto.isEnabled);
    }

    @Patch(':id/set-default')
    @ApiOperation({ summary: 'Set an AI provider as the default' })
    @ApiResponse({ status: 200, description: 'Default provider updated' })
    setDefault(@GetUser('userId') userId: string, @Param('id') id: string) {
        return this.aiProvidersService.setDefault(userId, id);
    }

    @Get(':id/health')
    @ApiOperation({ summary: 'Check the health of a stored AI provider key' })
    @ApiResponse({ status: 200, description: 'Health status returned' })
    healthCheck(@GetUser('userId') userId: string, @Param('id') id: string) {
        return this.aiProvidersService.healthCheck(userId, id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove an AI provider' })
    @ApiResponse({ status: 200, description: 'Provider removed' })
    remove(@GetUser('userId') userId: string, @Param('id') id: string) {
        return this.aiProvidersService.remove(userId, id);
    }
}