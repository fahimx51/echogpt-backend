import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {

    @ApiProperty({ example: 'Jane Doe' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    name: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongPass123!' })
    @IsString()
    @MinLength(6)
    password: string;
}