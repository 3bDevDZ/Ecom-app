import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * User Decorator
 * 
 * Extracts the current user from the request object
 * Usage: @User() user: UserPayload
 */
export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

