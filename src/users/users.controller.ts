import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get(':id')
    @ApiOperation({ summary: 'Get user profile by ID' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })

    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user profile' })
    
    updateProfile(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.updateProfile(id, dto);
    }

    @Patch(':id/password')
    @ApiOperation({ summary: 'Change user password' })
    changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete user account' })
    remove(@Param('id') id: string) {
        return this.usersService.delete(id);
    }
}