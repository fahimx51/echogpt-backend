import {
    Injectable,
    NotFoundException,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { RegisterDto } from '../auth/dto/register.dto.js';


@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                subscription: {
                    create: {}, // defaults to FREE plan
                },
            },
        });

        return this.excludePassword(user);
    }

    async findAll() {
        const users = await this.prisma.user.findMany();
        return users.map((u) => this.excludePassword(u));
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return this.excludePassword(user);
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async updateProfile(id: string, dto: UpdateUserDto) {
        await this.findById(id);
        const user = await this.prisma.user.update({
            where: { id },
            data: dto,
        });
        return this.excludePassword(user);
    }

    async changePassword(id: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async delete(id: string) {
        await this.findById(id);
        await this.prisma.user.delete({ where: { id } });
        return { message: 'Account deleted successfully' };
    }

    private excludePassword(user: any) {
        const { password, ...rest } = user;
        return rest;
    }
}