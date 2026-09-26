import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AIProviderName } from '../generated/prisma/client.js';
import { encrypt, decrypt, maskKey } from '../common/utils/encryption.util.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';
import { UpdateProviderDto } from './dto/update-provider.dto.js';

@Injectable()
export class AiProvidersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateProviderDto) {
        const existing = await this.prisma.aIProvider.findUnique({
            where: { userId_name: { userId, name: dto.name } },
        });
        if (existing) {
            throw new ConflictException(`${dto.name} provider already added`);
        }

        const isFirstProvider = (await this.prisma.aIProvider.count({
            where: { userId },
        })) === 0;

        const provider = await this.prisma.aIProvider.create({
            data: {
                userId,
                name: dto.name,
                apiKeyEnc: encrypt(dto.apiKey),
                defaultModel: dto.defaultModel,
                isDefault: isFirstProvider, // first provider added becomes default automatically
            },
        });

        return this.toSafeResponse(provider, dto.apiKey);
    }

    async findAll(userId: string) {
        const providers = await this.prisma.aIProvider.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        return providers.map((p) => this.toSafeResponse(p));
    }

    async findOne(userId: string, id: string) {
        const provider = await this.findOwned(userId, id);
        return this.toSafeResponse(provider);
    }

    async update(userId: string, id: string, dto: UpdateProviderDto) {
        await this.findOwned(userId, id);

        const provider = await this.prisma.aIProvider.update({
            where: { id },
            data: dto.apiKey ? { apiKeyEnc: encrypt(dto.apiKey) } : {},
        });

        return this.toSafeResponse(provider, dto.apiKey);
    }

    async setDefaultModel(userId: string, id: string, model: string) {
        await this.findOwned(userId, id);
        const provider = await this.prisma.aIProvider.update({
            where: { id },
            data: { defaultModel: model },
        });
        return this.toSafeResponse(provider);
    }

    async remove(userId: string, id: string) {
        const provider = await this.findOwned(userId, id);
        await this.prisma.aIProvider.delete({ where: { id } });

        // If the deleted provider was default, promote another one if any remain
        if (provider.isDefault) {
            const next = await this.prisma.aIProvider.findFirst({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            });
            if (next) {
                await this.prisma.aIProvider.update({
                    where: { id: next.id },
                    data: { isDefault: true },
                });
            }
        }

        return { message: 'Provider removed successfully' };
    }

    async setEnabled(userId: string, id: string, isEnabled: boolean) {
        await this.findOwned(userId, id);
        const provider = await this.prisma.aIProvider.update({
            where: { id },
            data: { isEnabled },
        });
        return this.toSafeResponse(provider);
    }

    async setDefault(userId: string, id: string) {
        const target = await this.findOwned(userId, id);
        if (!target.isEnabled) {
            throw new ConflictException('Cannot set a disabled provider as default');
        }

        await this.prisma.$transaction([
            this.prisma.aIProvider.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            }),
            this.prisma.aIProvider.update({
                where: { id },
                data: { isDefault: true },
            }),
        ]);

        return this.findOne(userId, id);
    }

    async healthCheck(userId: string, id: string) {
        const provider = await this.findOwned(userId, id);

        if (!provider.isEnabled) {
            return { status: 'disabled', name: provider.name };
        }

        try {
            decrypt(provider.apiKeyEnc); // confirms the stored key is readable/uncorrupted
            // Note: a full check would make a lightweight real call to the provider's API
            // (e.g. list models) to confirm the key itself is valid. Kept local-only here
            // to avoid burning the user's real API quota on every health check.
            return { status: 'ok', name: provider.name };
        } catch {
            return { status: 'error', name: provider.name, message: 'Stored key could not be decrypted' };
        }
    }

    /**
     * Used internally by ChatModule to get the actual decrypted key + provider
     * for making a real API call. Never exposed directly via a controller route.
     */
    async getDecryptedKeyForChat(userId: string, providerName?: AIProviderName) {
        const provider = providerName
            ? await this.prisma.aIProvider.findUnique({
                where: { userId_name: { userId, name: providerName } },
            })
            : await this.prisma.aIProvider.findFirst({
                where: { userId, isDefault: true },
            });

        if (!provider) {
            throw new NotFoundException(
                providerName
                    ? `No ${providerName} provider configured`
                    : 'No default AI provider configured',
            );
        }
        if (!provider.isEnabled) {
            throw new ConflictException(`${provider.name} provider is disabled`);
        }

        return {
            name: provider.name,
            apiKey: decrypt(provider.apiKeyEnc),
            defaultModel: provider.defaultModel,
        };
    }

    private async findOwned(userId: string, id: string) {
        const provider = await this.prisma.aIProvider.findUnique({ where: { id } });
        if (!provider || provider.userId !== userId) {
            throw new NotFoundException('Provider not found');
        }
        return provider;
    }

    private toSafeResponse(provider: any, plainKeyForMasking?: string) {
        const { apiKeyEnc, ...rest } = provider;
        return {
            ...rest,
            apiKeyPreview: plainKeyForMasking
                ? maskKey(plainKeyForMasking)
                : '****', // can't reverse-mask without decrypting; kept minimal on reads
        };
    }
}