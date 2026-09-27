import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({ status: 200, description: 'Stats returned' })
    @ApiResponse({ status: 403, description: 'Admin role required' })
    getDashboard() {
        return this.adminService.getDashboardStats();
    }

    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Users returned' })
    getUsers(@Query('take') take?: string, @Query('skip') skip?: string) {
        return this.adminService.getAllUsers(
            take ? parseInt(take, 10) : undefined,
            skip ? parseInt(skip, 10) : undefined,
        );
    }

    @Get('users/:id')
    @ApiOperation({ summary: 'Get a single user with full details' })
    @ApiResponse({ status: 200, description: 'User returned' })
    @ApiResponse({ status: 404, description: 'User not found' })
    getUser(@Param('id') id: string) {
        return this.adminService.getUserById(id);
    }

    @Patch('users/:id/role')
    @ApiOperation({ summary: "Update a user's role" })
    @ApiResponse({ status: 200, description: 'Role updated' })
    updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
        return this.adminService.updateUserRole(id, dto.role);
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete a user account' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Get('subscriptions')
    @ApiOperation({ summary: 'List all subscriptions' })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Subscriptions returned' })
    getSubscriptions(@Query('take') take?: string, @Query('skip') skip?: string) {
        return this.adminService.getAllSubscriptions(
            take ? parseInt(take, 10) : undefined,
            skip ? parseInt(skip, 10) : undefined,
        );
    }

    @Get('ai-providers')
    @ApiOperation({ summary: 'List all configured AI providers across users' })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Providers returned' })
    getProviders(@Query('take') take?: string, @Query('skip') skip?: string) {
        return this.adminService.getAllProviders(
            take ? parseInt(take, 10) : undefined,
            skip ? parseInt(skip, 10) : undefined,
        );
    }

    @Get('analytics')
    @ApiOperation({ summary: 'Get API usage analytics' })
    @ApiResponse({ status: 200, description: 'Analytics returned' })
    getAnalytics() {
        return this.adminService.getUsageAnalytics();
    }

    @Get('logs')
    @ApiOperation({ summary: 'Get raw request logs' })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Logs returned' })
    getLogs(@Query('take') take?: string, @Query('skip') skip?: string) {
        return this.adminService.getRequestLogs(
            take ? parseInt(take, 10) : undefined,
            skip ? parseInt(skip, 10) : undefined,
        );
    }

    @Get('health')
    @ApiOperation({ summary: 'Get system health status' })
    @ApiResponse({ status: 200, description: 'Health status returned' })
    getHealth() {
        return this.adminService.getSystemHealth();
    }
}