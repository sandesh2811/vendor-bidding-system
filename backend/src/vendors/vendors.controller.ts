import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorators';
import { UserRole } from '../common/constants';
import { IdParamDto } from '../common/dto/id-param.dto';
import type { Paginated } from '../common/pagination.helper';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ListVendorsQueryDto } from './dto/list-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import type { Vendor } from './vendor.entity';
import { VendorsDocs } from './vendors.docs';
import { VendorsService } from './vendors.service';

@VendorsDocs.controller()
@Auth(UserRole.Admin)
@SerializeOptions({ groups: [UserRole.Admin] })
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Post()
  @VendorsDocs.create()
  create(@Body() dto: CreateVendorDto): Promise<Vendor> {
    return this.vendors.create(dto);
  }

  @Get()
  @VendorsDocs.findAll()
  findAll(@Query() query: ListVendorsQueryDto): Promise<Paginated<Vendor>> {
    return this.vendors.findAll(query);
  }

  @Get(':id')
  @VendorsDocs.findOne()
  findOne(@Param() { id }: IdParamDto): Promise<Vendor> {
    return this.vendors.findById(id);
  }

  @Patch(':id')
  @VendorsDocs.update()
  update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateVendorDto,
  ): Promise<Vendor> {
    return this.vendors.update(id, dto);
  }
}
