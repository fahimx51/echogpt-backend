import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
    @Get()
    root() {
        return {
            name: 'EchoGPT Backend API',
            status: 'ok',
            docs: '/docs',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('health')
    health() {
        return { status: 'ok', uptime: process.uptime() };
    }
}