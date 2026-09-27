import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../../generated/prisma/client.js';

export class UpdateUserRoleDto {
    @ApiProperty({ enum: Role, example: Role.ADMIN })
    @IsEnum(Role)
    role: Role;
}