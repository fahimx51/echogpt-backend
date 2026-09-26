import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { AIProviderName } from '../../generated/prisma/client.js';

export class SendMessageDto {
    @ApiProperty({ example: 'Explain event loops in Node.js' })
    @IsString()
    @MinLength(1)
    prompt: string;

    @ApiProperty({
        enum: AIProviderName,
        required: false,
        description: 'Which provider to use. Defaults to the user\'s default provider if omitted.',
    })
    @IsOptional()
    @IsEnum(AIProviderName)
    provider?: AIProviderName;

    @ApiProperty({
        required: false,
        example: 'gemini-3.5-flash-lite',
        description: 'Specific model to use. Defaults to the provider\'s saved default model if omitted.',
    })
    @IsOptional()
    @IsString()
    model?: string;

    @ApiProperty({
        required: false,
        description: 'ID of an existing conversation to continue. Omit to start a new conversation.',
    })
    @IsOptional()
    @IsString()
    conversationId?: string;
}