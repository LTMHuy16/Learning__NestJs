import { PrismaService } from './../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HomeResponseDto, UpdateHomeDto } from './dto/home.dto';
import { PropertyType } from '@prisma/client';

interface GetHomeParams {
  city?: string;
  price?: {
    gte?: number;
    lte?: number;
  };
  propertyType?: string;
}

interface CreateHomeParams {
  address: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  city: string;
  price: number;
  landSize: number;
  propertyType: PropertyType;
  images: { url: string }[];
}

interface UpdateHomeParams {
  address?: string;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  city?: string;
  price?: number;
  landSize?: number;
  propertyType?: PropertyType;
}

interface NavigationFilters {
  skip?: number;
  take?: number;
}

@Injectable()
export class HomeService {
  constructor(private readonly PrismaService: PrismaService) {}

  async getHomes(
    filters: GetHomeParams,
    navigation: NavigationFilters,
  ): Promise<HomeResponseDto[]> {
    const homes = await this.PrismaService.home.findMany({
      select: {
        id: true,
        address: true,
        city: true,
        listed_date: true,
        price: true,
        land_size: true,
        property_type: true,
        created_at: true,
        updated_at: true,
        realtor_id: true,
        images: {
          select: {
            url: true,
          },
        },
      },
      where: filters,
      ...navigation,
    });

    return homes.map((home) => {
      const fetchHome = {
        ...home,
        ...(home.images[0] && { image: home.images[0].url }),
      };
      delete fetchHome.images;
      return new HomeResponseDto(fetchHome);
    });
  }

  async getHome(id: number) {
    const home = await this.PrismaService.home.findUnique({ where: { id } });
  }

  async createHome(
    {
      address,
      numberOfBathrooms,
      numberOfBedrooms,
      city,
      landSize,
      price,
      propertyType,
      images,
    }: CreateHomeParams,
    realtor_id: number,
  ) {
    const newHome = await this.PrismaService.home.create({
      data: {
        address,
        city,
        num_of_bath: numberOfBathrooms,
        num_of_bed: numberOfBedrooms,
        price,
        property_type: propertyType,
        realtor_id,
        land_size: landSize,
      },
    });

    const homeImages = images.map((image) => {
      return { ...image, home_id: newHome.id };
    });

    await this.PrismaService.image.createMany({ data: homeImages });

    return new HomeResponseDto(newHome);
  }

  async updateHomeById(id: number, data: UpdateHomeParams) {
    const home = await this.PrismaService.home.findUnique({ where: { id } });

    if (!home) throw new NotFoundException();

    const updatedHome = await this.PrismaService.home.update({
      where: { id },
      data: {
        address: data.address,
        city: data.city,
        price: data.price,
        land_size: data.landSize,
        num_of_bath: data.numberOfBathrooms,
        num_of_bed: data.numberOfBedrooms,
        property_type: data.propertyType,
      },
    });

    return new HomeResponseDto(updatedHome);
  }

  async deleteHomeById(id: number) {
    const home = await this.PrismaService.home.delete({ where: { id } });

    return home;
  }

  async getRealtorByHomeId(id: number) {
    const home = await this.PrismaService.home.findUnique({
      where: { id },
      select: {
        realtor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!home) throw new NotFoundException();

    return home.realtor;
  }
}
