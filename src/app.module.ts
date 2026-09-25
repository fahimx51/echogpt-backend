import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';


@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
