import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto, userAgent?: string, ipAddress?: string) {
        const user = await this.usersService.create(dto);
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.createSession(user.id, tokens.refreshToken, userAgent, ipAddress);
        return { user, ...tokens };
    }

    async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.createSession(user.id, tokens.refreshToken, userAgent, ipAddress);

        const { password, ...safeUser } = user;
        return { user: safeUser, ...tokens };
    }

    async refresh(dto: RefreshTokenDto) {
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!refreshSecret) {
            throw new Error('JWT_REFRESH_SECRET is not set in environment variables');
        }

        let payload: { sub: string; email: string; role: string };
        try {
            payload = await this.jwtService.verifyAsync(dto.refreshToken, {
                secret: refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const session = await this.prisma.session.findFirst({
            where: { userId: payload.sub, refreshToken: dto.refreshToken },
        });
        if (!session) {
            throw new UnauthorizedException('Refresh token not recognized');
        }

        if (session.expiresAt < new Date()) {
            await this.prisma.session.delete({ where: { id: session.id } });
            throw new UnauthorizedException('Refresh token expired');
        }

        // Rotate: delete the old session, issue a fresh pair
        await this.prisma.session.delete({ where: { id: session.id } });

        const tokens = await this.generateTokens(payload.sub, payload.email, payload.role);
        await this.createSession(
            payload.sub,
            tokens.refreshToken,
            session.userAgent ?? undefined,
            session.ipAddress ?? undefined,
        );

        return tokens;
    }

    async logout(dto: RefreshTokenDto) {
        const session = await this.prisma.session.findFirst({
            where: { refreshToken: dto.refreshToken },
        });

        if (!session) {
            throw new BadRequestException('Session not found');
        }

        await this.prisma.session.delete({ where: { id: session.id } });
        return { message: 'Logged out successfully' };
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
    ): Promise<TokenPair> {
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!accessSecret || !refreshSecret) {
            throw new Error('JWT secrets are not set in environment variables');
        }

        const payload = { sub: userId, email, role };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: accessSecret,
            expiresIn: (process.env.JWT_ACCESS_EXPIRY ?? '15m') as any,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: refreshSecret,
            expiresIn: (process.env.JWT_REFRESH_EXPIRY ?? '7d') as any,
        });

        return { accessToken, refreshToken };
    }

    private async createSession(
        userId: string,
        refreshToken: string,
        userAgent?: string,
        ipAddress?: string,
    ) {
        const expiryDays = this.parseDaysFromExpiry(
            process.env.JWT_REFRESH_EXPIRY ?? '7d',
        );
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        return this.prisma.session.create({
            data: {
                userId,
                refreshToken,
                userAgent,
                ipAddress,
                expiresAt,
            },
        });
    }

    private parseDaysFromExpiry(expiry: string): number {
        const match = expiry.match(/^(\d+)d$/);
        return match ? parseInt(match[1], 10) : 7;
    }
}