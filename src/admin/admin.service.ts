import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/client.js';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats() {
        const [
            totalUsers,
            totalAdmins,
            totalChats,
            totalSearches,
            totalProviders,
            subscriptionsByPlan,
            usersLast7Days,
        ] = await this.prisma.$transaction([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: Role.ADMIN } }),
            this.prisma.chat.count(),
            this.prisma.webSearch.count(),
            this.prisma.aIProvider.count(),
            this.prisma.subscription.groupBy({
                by: ['plan'],
                _count: { plan: true },
            }),
            this.prisma.user.count({
                where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            }),
        ]);

        return {
            totalUsers,
            totalAdmins,
            totalChats,
            totalSearches,
            totalProviders,
            subscriptionsByPlan: subscriptionsByPlan.map((s) => ({
                plan: s.plan,
                count: s._count.plan,
            })),
            newUsersLast7Days: usersLast7Days,
        };
    }

    // ---------- User Management ----------

    async getAllUsers(take = 20, skip = 0) {
        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count(),
        ]);
        return { data: users, total, take, skip };
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
                createdAt: true,
                subscription: true,
                _count: { select: { chats: true, searches: true, aiProviders: true } },
            },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateUserRole(id: string, role: Role) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, role: true },
        });
    }

    async deleteUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted successfully' };
    }

    // ---------- Subscription Management ----------

    async getAllSubscriptions(take = 20, skip = 0) {
        const [subscriptions, total] = await this.prisma.$transaction([
            this.prisma.subscription.findMany({
                take,
                skip,
                orderBy: { startedAt: 'desc' },
                include: { user: { select: { id: true, email: true, name: true } } },
            }),
            this.prisma.subscription.count(),
        ]);
        return { data: subscriptions, total, take, skip };
    }

    // ---------- AI Provider Management (admin view) ----------

    async getAllProviders(take = 20, skip = 0) {
        const [providers, total] = await this.prisma.$transaction([
            this.prisma.aIProvider.findMany({
                take,
                skip,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    defaultModel: true,
                    isEnabled: true,
                    isDefault: true,
                    createdAt: true,
                    user: { select: { id: true, email: true } },
                    // apiKeyEnc intentionally excluded — admins manage provider config, never see raw or encrypted keys
                },
            }),
            this.prisma.aIProvider.count(),
        ]);
        return { data: providers, total, take, skip };
    }

    // ---------- API Usage Analytics ----------

    async getUsageAnalytics() {
        const [byEndpoint, byStatusCode, last24h] = await this.prisma.$transaction([
            this.prisma.apiUsageLog.groupBy({
                by: ['endpoint'],
                _count: { endpoint: true },
                orderBy: { _count: { endpoint: 'desc' } },
                take: 10,
            }),
            this.prisma.apiUsageLog.groupBy({
                by: ['statusCode'],
                _count: { statusCode: true },
            }),
            this.prisma.apiUsageLog.count({
                where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            }),
        ]);

        return {
            topEndpoints: byEndpoint.map((e) => ({ endpoint: e.endpoint, count: e._count.endpoint })),
            byStatusCode: byStatusCode.map((s) => ({ statusCode: s.statusCode, count: s._count.statusCode })),
            requestsLast24h: last24h,
        };
    }

    // ---------- Request Logs ----------

    async getRequestLogs(take = 50, skip = 0) {
        const [logs, total] = await this.prisma.$transaction([
            this.prisma.apiUsageLog.findMany({
                take,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.apiUsageLog.count(),
        ]);
        return { data: logs, total, take, skip };
    }

    // ---------- System Health ----------

    async getSystemHealth() {
        let dbStatus: 'ok' | 'error' = 'ok';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch {
            dbStatus = 'error';
        }

        return {
            status: dbStatus === 'ok' ? 'healthy' : 'degraded',
            database: dbStatus,
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        };
    }
}