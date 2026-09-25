import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProviderDto {
    @ApiProperty({ example: 'sk-...', required: false })
    @IsOptional()
    @IsString()
    @MinLength(10)
    apiKey?: string;
}