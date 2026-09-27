import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsageLogInterceptor implements NestInterceptor {
    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        const endpoint = req.route?.path ?? req.url;
        const method = req.method;

        const logUsage = (statusCode: number) => {
            const userId = req.user?.userId ?? null;
            this.prisma.apiUsageLog
                .create({ data: { userId, endpoint, method, statusCode } })
                .catch(() => {
                    // Never let logging failures break the actual request
                });
        };

        return next.handle().pipe(
            tap(() => logUsage(res.statusCode)),
            catchError((err) => {
                logUsage(err?.status ?? 500);
                return throwError(() => err);
            }),
        );
    }
}