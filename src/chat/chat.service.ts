import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiProvidersService } from '../ai-providers/ai-providers.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { callAIProvider } from './providers/ai-client.factory.js';

@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiProvidersService: AiProvidersService,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async sendMessage(userId: string, dto: SendMessageDto) {
        await this.subscriptionsService.checkAndIncrementUsage(userId);

        const conversationId = dto.conversationId ?? randomUUID();

        const priorMessages = dto.conversationId
            ? await this.prisma.chat.findMany({
                where: { userId, conversationId },
                orderBy: { createdAt: 'asc' },
            })
            : [];

        const { name, apiKey, defaultModel } = await this.aiProvidersService.getDecryptedKeyForChat(
            userId,
            dto.provider,
        );

        const modelToUse = dto.model ?? defaultModel ?? undefined;

        const { text } = await callAIProvider(name, apiKey, dto.prompt, modelToUse, priorMessages);

        const chat = await this.prisma.chat.create({
            data: {
                userId,
                conversationId,
                provider: name,
                prompt: dto.prompt,
                response: text,
            },
        });

        return chat;
    }

    async getHistory(userId: string, take = 20, skip = 0) {
        const [chats, total] = await this.prisma.$transaction([
            this.prisma.chat.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.chat.count({ where: { userId } }),
        ]);

        return { data: chats, total, take, skip };
    }

    async getConversation(userId: string, conversationId: string) {
        return this.prisma.chat.findMany({
            where: { userId, conversationId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getConversationsList(userId: string) {
        const allChats = await this.prisma.chat.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const seen = new Set<string>();
        const conversations = [];
        for (const chat of allChats) {
            if (!seen.has(chat.conversationId)) {
                seen.add(chat.conversationId);
                conversations.push({
                    conversationId: chat.conversationId,
                    lastMessage: chat.prompt,
                    lastResponse: chat.response,
                    updatedAt: chat.createdAt,
                });
            }
        }
        return conversations;
    }

    async getOne(userId: string, id: string) {
        const chat = await this.prisma.chat.findFirst({
            where: { id, userId },
        });
        return chat;
    }
}