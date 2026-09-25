import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    currentPassword: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    newPassword: string;
}