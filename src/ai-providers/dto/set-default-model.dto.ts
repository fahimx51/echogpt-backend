import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetDefaultModelDto {
    @ApiProperty({ example: 'gpt-4o-mini' })
    @IsString()
    model: string;
}