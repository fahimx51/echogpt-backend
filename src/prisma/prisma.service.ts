import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
            ],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Prisma connected to database');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    /**
     * Clears all tables — intended for e2e test teardown only.
     * Never call this outside a test environment.
     */
    async cleanDatabase() {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('cleanDatabase() can only be called in test environment');
        }
        const modelKeys = Object.keys(this).filter(
            (key) => key[0] !== '_' && key[0] !== '$',
        );
        return Promise.all(
            modelKeys.map((modelKey) => (this as any)[modelKey].deleteMany()),
        );
    }
}