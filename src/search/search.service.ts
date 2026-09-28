import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { AiProvidersService } from '../ai-providers/ai-providers.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { callAIProvider } from '../chat/providers/ai-client.factory.js';
import { searchWeb } from './providers/serper.client.js';

type SearchResult = { title: string; link: string; snippet: string };

@Injectable()
export class SearchService {
    private readonly cacheTtl = Number(process.env.SEARCH_CACHE_TTL_SECONDS ?? 86400);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly aiProvidersService: AiProvidersService,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async search(userId: string, query: string) {
        await this.subscriptionsService.checkAndIncrementUsage(userId);

        const { results, cached } = await this.getResults(query);

        const { name, apiKey, defaultModel } = await this.aiProvidersService.getDecryptedKeyForChat(
            userId,
        );

        const summaryPrompt = this.buildSummaryPrompt(query, results);
        const { text: aiSummary } = await callAIProvider(
            name,
            apiKey,
            summaryPrompt,
            defaultModel ?? undefined,
        );

        const record = await this.prisma.webSearch.create({
            data: {
                userId,
                query,
                results: { organic: results, aiSummary } as any,
            },
        });

        return { ...record, cached };
    }

    async getHistory(userId: string, take = 20, skip = 0) {
        const [searches, total] = await this.prisma.$transaction([
            this.prisma.webSearch.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.webSearch.count({ where: { userId } }),
        ]);
        return { data: searches, total, take, skip };
    }

    async getRecent(userId: string, limit = 5) {
        return this.prisma.webSearch.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true, query: true, createdAt: true },
        });
    }

    async getSuggestions(userId: string, partial: string) {
        if (!partial || partial.trim().length === 0) return [];

        const matches = await this.prisma.webSearch.findMany({
            where: {
                userId,
                query: { contains: partial, mode: 'insensitive' },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { query: true },
        });

        const unique = [...new Set(matches.map((m) => m.query))];
        return unique.slice(0, 5);
    }

    /** Serper results don't depend on the user, so the cache is shared across users. */
    private async getResults(query: string): Promise<{ results: SearchResult[]; cached: boolean }> {
        const key = this.cacheKey(query);

        const hit = await this.redis.getJson<SearchResult[]>(key);
        if (hit) return { results: hit, cached: true };

        const results = await searchWeb(query);
        if (results.length > 0) {
            await this.redis.setJson(key, results, this.cacheTtl);
        }
        return { results, cached: false };
    }

    private cacheKey(query: string): string {
        const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
        return `search:serper:${createHash('sha256').update(normalized).digest('hex')}`;
    }

    private buildSummaryPrompt(query: string, results: SearchResult[]): string {
        const resultsText = results
            .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}\nSource: ${r.link}`)
            .join('\n\n');

        return `Based on these web search results for the query "${query}", provide a concise, direct answer. Cite sources by number where relevant.\n\n${resultsText}`;
    }
}