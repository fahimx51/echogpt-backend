import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
    private readonly logger = new Logger(RedisService.name);
    private readonly client: Redis;

    constructor() {
        this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
        });
        this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
        this.client.on('ready', () => this.logger.log('Redis connected'));
    }

    async getJson<T>(key: string): Promise<T | null> {
        try {
            const raw = await this.client.get(key);
            return raw ? (JSON.parse(raw) as T) : null;
        } catch (err) {
            this.logger.warn(`GET ${key} failed: ${(err as Error).message}`);
            return null;
        }
    }

    async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (err) {
            this.logger.warn(`SET ${key} failed: ${(err as Error).message}`);
        }
    }

    async onApplicationShutdown() {
        await this.client.quit();
    }
}