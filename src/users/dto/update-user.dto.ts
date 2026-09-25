import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ example: 'Jane Doe', required: false })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    name?: string;
}