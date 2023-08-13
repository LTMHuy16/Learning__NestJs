import { PrismaService } from './../../prisma/prisma.service';
import {
  Body,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { User, UserType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface SignInParams {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly PrismaService: PrismaService) {}

  async signUp(
    { name, email, password, phone }: SignUpParams,
    userType: UserType,
  ) {
    const userExist = await this.PrismaService.user.findUnique({
      where: { email },
    });

    if (userExist) throw new ConflictException('User is exist.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.PrismaService.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        user_type: UserType.ADMIN,
      },
    });

    const token = this.generateJWT(newUser.name, newUser.id);

    return {
      ...newUser,
      token,
    };
  }

  async signIn({ email, password }: SignInParams) {
    const user = await this.PrismaService.user.findUnique({ where: { email } });

    if (!user) throw new HttpException('Invalid credentials.', 400);

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) throw new HttpException('Invalid credentials.', 400);

    const token = this.generateJWT(user.name, user.id);

    return {
      ...user,
      token,
    };
  }

  generateProductKey(email: string, userType: UserType) {
    const productKey = `${email}-${userType}-${process.env.PRODUCT_SECRET}`;

    return bcrypt.hash(productKey, 10);
  }

  private generateJWT(name: string, id: number) {
    return jwt.sign({ name, id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  }
}
