import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanType } from '../../generated/prisma/client.js';

export class ChangePlanDto {
    @ApiProperty({ enum: PlanType, example: PlanType.PREMIUM })
    @IsEnum(PlanType)
    plan: PlanType;
}