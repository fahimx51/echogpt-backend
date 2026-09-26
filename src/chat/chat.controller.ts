import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    @ApiOperation({ summary: 'Send a prompt and receive an AI response' })
    @ApiResponse({ status: 201, description: 'AI response returned' })
    @ApiResponse({ status: 403, description: 'Usage limit reached' })
    @ApiResponse({ status: 404, description: 'No provider configured' })
    @ApiResponse({ status: 502, description: 'Provider API call failed' })
    send(@GetUser('userId') userId: string, @Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(userId, dto);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get flat conversation history (all messages)' })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'History returned' })
    getHistory(
        @GetUser('userId') userId: string,
        @Query('take') take?: string,
        @Query('skip') skip?: string,
    ) {
        return this.chatService.getHistory(
            userId,
            take ? parseInt(take, 10) : undefined,
            skip ? parseInt(skip, 10) : undefined,
        );
    }

    @Get('conversations')
    @ApiOperation({ summary: 'List all conversations (one preview per thread)' })
    @ApiResponse({ status: 200, description: 'Conversations returned' })
    getConversations(@GetUser('userId') userId: string) {
        return this.chatService.getConversationsList(userId);
    }

    @Get('conversations/:conversationId')
    @ApiOperation({ summary: 'Get all messages in a single conversation' })
    @ApiResponse({ status: 200, description: 'Conversation messages returned' })
    getConversation(
        @GetUser('userId') userId: string,
        @Param('conversationId') conversationId: string,
    ) {
        return this.chatService.getConversation(userId, conversationId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single chat message by ID' })
    @ApiResponse({ status: 200, description: 'Chat returned' })
    getOne(@GetUser('userId') userId: string, @Param('id') id: string) {
        return this.chatService.getOne(userId, id);
    }
}