import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongPass123!' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'Jane Doe', required: false })
    @IsOptional()
    @IsString()
    name?: string;
}