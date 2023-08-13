import {
  Body,
  Controller,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { UserType } from '@prisma/client';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { SignInDto, SignUpDto, GenerateProductDto } from '../dtos/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @Post('/signup/:userType')
  async signUp(
    @Body() body: SignUpDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType != UserType.BUYER) {
      if (!body.productKey) throw new UnauthorizedException();

      const validProductKey = `${body.email}-${userType}-${process.env.PRODUCT_SECRET}`;

      const isValidProductKey = await bcrypt.compare(
        validProductKey,
        body.productKey,
      );

      if (!isValidProductKey) throw new UnauthorizedException();
    }

    return this.AuthService.signUp(body, userType);
  }

  @Post('/signin')
  async signIn(@Body() body: SignInDto) {
    return this.AuthService.signIn(body);
  }

  @Post('/key')
  generateProductKey(@Body() { email, userType }: GenerateProductDto) {
    return this.AuthService.generateProductKey(email, userType);
  }
}
