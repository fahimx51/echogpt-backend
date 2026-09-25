import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlanType } from '../generated/prisma/client.js';

const PLAN_LIMITS: Record<PlanType, number> = {
    FREE: 50,
    PREMIUM: 1000,
};

@Injectable()
export class SubscriptionsService {
    constructor(private readonly prisma: PrismaService) { }

    async getStatus(userId: string) {
        const subscription = await this.findOrCreate(userId);
        return subscription;
    }

    async getUsage(userId: string) {
        const subscription = await this.findOrCreate(userId);
        return {
            plan: subscription.plan,
            requestsUsed: subscription.requestsUsed,
            requestsLimit: subscription.requestsLimit,
            remaining: Math.max(subscription.requestsLimit - subscription.requestsUsed, 0),
        };
    }

    async changePlan(userId: string, plan: PlanType) {
        const subscription = await this.findOrCreate(userId);

        const renewsAt = new Date();
        renewsAt.setMonth(renewsAt.getMonth() + 1);

        return this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                plan,
                requestsLimit: PLAN_LIMITS[plan],
                requestsUsed: 0,
                renewsAt,
            },
        });
    }

    /**
     * Called by other modules (Chat, WebSearch) before serving a request
     * that counts against the user's quota. Throws if the user is at their limit.
     */
    async checkAndIncrementUsage(userId: string) {
        const subscription = await this.findOrCreate(userId);

        if (subscription.requestsUsed >= subscription.requestsLimit) {
            throw new ForbiddenException(
                'Request limit reached for your current plan. Please upgrade.',
            );
        }

        return this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { requestsUsed: { increment: 1 } },
        });
    }

    private async findOrCreate(userId: string) {
        let subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');

            subscription = await this.prisma.subscription.create({
                data: { userId },
            });
        }

        return subscription;
    }
}