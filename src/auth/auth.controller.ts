import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { GetUser } from './decorators/get-user.decorator.js';
import type { RequestUser } from './decorators/get-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email already in use' })
    register(@Body() dto: RegisterDto, @Req() req: Request) {
        return this.authService.register(
            dto,
            req.headers['user-agent'],
            req.ip,
        );
    }

    @Post('login')
    @ApiOperation({ summary: 'Log in with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login(
            dto,
            req.headers['user-agent'],
            req.ip,
        );
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Get a new access token using a refresh token' })
    @ApiResponse({ status: 200, description: 'Token refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }

    @Post('logout')
    @ApiOperation({ summary: 'Log out and invalidate the refresh token' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    logout(@Body() dto: RefreshTokenDto) {
        return this.authService.logout(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get the currently authenticated user' })
    @ApiResponse({ status: 200, description: 'Current user returned' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })

    getMe(@GetUser() user: RequestUser) {
        return this.usersService.findById(user.userId);
    }
}