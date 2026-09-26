import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@ApiTags('Web Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Post()
    @ApiOperation({ summary: 'Perform an AI-assisted web search' })
    @ApiResponse({ status: 201, description: 'Search results and AI summary returned' })
    @ApiResponse({ status: 403, description: 'Usage limit reached' })
    @ApiResponse({ status: 404, description: 'No provider configured' })
    @ApiResponse({ status: 502, description: 'Search or AI provider call failed' })
    search(@GetUser('userId') userId: string, @Body() dto: SearchQueryDto) {
        return this.searchService.search(userId, dto.query);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get search history' })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Search history returned' })
    getHistory(
        @GetUser('userId') userId: string,
        @Query('take') take?: string,
        @Query('skip') skip?: string,
    ) {
        return this.searchService.getHistory(
            userId,
            take ? parseInt(take, 10) : undefined,
            skip ? parseInt(skip, 10) : undefined,
        );
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get most recent searches' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Recent searches returned' })
    getRecent(@GetUser('userId') userId: string, @Query('limit') limit?: string) {
        return this.searchService.getRecent(userId, limit ? parseInt(limit, 10) : undefined);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get search suggestions based on past queries' })
    @ApiQuery({ name: 'q', required: true, type: String })
    @ApiResponse({ status: 200, description: 'Suggestions returned' })
    getSuggestions(@GetUser('userId') userId: string, @Query('q') partial: string) {
        return this.searchService.getSuggestions(userId, partial);
    }
}