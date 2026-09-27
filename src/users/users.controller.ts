import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    UseGuards,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: "Get the logged-in user's profile" })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    findOne(@GetUser('userId') userId: string) {
        return this.usersService.findById(userId);
    }

    @Patch('me')
    @ApiOperation({ summary: "Update the logged-in user's profile" })
    updateProfile(@GetUser('userId') userId: string, @Body() dto: UpdateUserDto) {
        return this.usersService.updateProfile(userId, dto);
    }

    @Patch('me/password')
    @ApiOperation({ summary: "Change the logged-in user's password" })
    changePassword(@GetUser('userId') userId: string, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(userId, dto);
    }

    @Delete('me')
    @ApiOperation({ summary: "Delete the logged-in user's own account" })
    remove(@GetUser('userId') userId: string) {
        return this.usersService.delete(userId);
    }
}