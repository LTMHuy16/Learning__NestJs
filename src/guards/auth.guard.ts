import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserInfo } from 'os';
import { UserType } from '@prisma/client';

interface JWTPayload {
  name: string;
  id: number;
  iat: number;
  ext: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles: UserType[] = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (roles?.length) {
      try {
        const request = context.switchToHttp().getRequest();
        const token = request?.headers?.authorization?.split(' ')?.[1];
        const payload = (await jwt.verify(
          token,
          process.env.JWT_SECRET,
        )) as JWTPayload;

        const user = await this.prismaService.user.findUnique({
          where: { id: payload.id },
        });

        if (!user || !roles.includes(user.user_type)) return false;

        return true;
      } catch (error) {
        return false;
      }
    }

    return true;
  }
}
