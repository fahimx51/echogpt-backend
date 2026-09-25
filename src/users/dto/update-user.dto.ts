import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ example: 'Jane Doe', required: false })
    @IsOptional()
    @IsString()
    name?: string;
}