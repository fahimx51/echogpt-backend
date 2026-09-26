import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
    @ApiProperty({ example: 'latest developments in quantum computing' })
    @IsString()
    @MinLength(1)
    query: string;
}