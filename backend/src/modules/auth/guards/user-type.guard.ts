import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  AuthorizedUserTypeMetadata,
} from 'src/decorators/user-type.decorator';
import { IS_PUBLIC_KEY } from 'src/decorators/is-public';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const metadata =
      this.reflector.getAllAndOverride<AuthorizedUserTypeMetadata>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!metadata?.userTypes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return metadata.userTypes.some(
      (userType) =>
        metadata.canAccess &&
        user.type === userType &&
        (metadata.roles ? metadata.roles.includes(user.role) : true),
    );
  }
}
