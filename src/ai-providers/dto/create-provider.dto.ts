import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { AIProviderName } from '../../generated/prisma/client.js';

export class CreateProviderDto {
    @ApiProperty({ enum: AIProviderName, example: AIProviderName.OPENAI })
    @IsEnum(AIProviderName)
    name: AIProviderName;

    @ApiProperty({ example: 'sk-...' })
    @IsString()
    @MinLength(10)
    apiKey: string;
}