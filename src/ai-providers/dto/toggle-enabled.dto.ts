import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleEnabledDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    isEnabled: boolean;
}