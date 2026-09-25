import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
    userId: string;
    email: string;
    role: string;
}

export const GetUser = createParamDecorator(
    (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user: RequestUser = request.user;
        return data ? user?.[data] : user;
    },
);