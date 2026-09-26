import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MinLength } from 'class-validator';
import { AIProviderName } from '../../generated/prisma/client.js';

export class CreateProviderDto {
    @ApiProperty({ enum: AIProviderName, example: AIProviderName.OPENAI })
    @IsEnum(AIProviderName)
    name: AIProviderName;

    @ApiProperty({ example: 'sk-...' })
    @IsString()
    @MinLength(10)
    apiKey: string;

    @ApiProperty({
        required: false,
        example: 'gpt-4o-mini',
        description: 'Preferred model for this provider. Falls back to the server default if omitted.',
    })
    @IsOptional()
    @IsString()
    defaultModel?: string;
}