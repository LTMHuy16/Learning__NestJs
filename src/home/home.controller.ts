import { User, UserInfo } from 'src/user/user.decorator';
import { CreateHomeDto, HomeResponseDto, UpdateHomeDto } from './dto/home.dto';
import { HomeService } from './home.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserType } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/user/decorators/role.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly HomeService: HomeService) {}

  @Get()
  getHomes(
    @Query('city') city?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('property_type') propertyType?: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ): Promise<HomeResponseDto[]> {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { gte: parseFloat(maxPrice) }),
          }
        : undefined;

    const homePerPage = perPage || 25;
    const currentPage = page || 1;
    const navigation = {
      skip: (currentPage - 1) * homePerPage,
      take: homePerPage,
    };

    const filters = {
      ...(city && { city }),
      ...(propertyType && { property_type: propertyType }),
      price,
    };

    return this.HomeService.getHomes(filters, navigation);
  }

  @Get(':id')
  getHome() {
    return {};
  }

  @Roles(UserType.REALTOR)
  // @UseGuards(AuthGuard)
  @Post()
  createHome(@Body() body: CreateHomeDto, @User() user: UserInfo) {
    return {};
    // return this.HomeService.createHome(body, user.id);
  }

  @Put(':id')
  async updateHome(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHomeDto,
    @User() user: UserInfo,
  ) {
    const realtor = await this.HomeService.getRealtorByHomeId(id);

    if (realtor.id !== user.id) throw new UnauthorizedException();

    return this.HomeService.updateHomeById(id, body);
  }

  @Delete(':id')
  deleteHome(@Param('id') id: number) {
    return this.HomeService.deleteHomeById(id);
  }

  @Get('/me')
  me() {
    return {};
  }
}
