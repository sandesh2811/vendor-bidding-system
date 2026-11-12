import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  StreamableFile,
} from '@nestjs/common';
import { Auth } from '../../auth/auth.decorators';
import { UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import type { Paginated } from '../../common/pagination.helper';
import { toStreamableFile } from '../../common/storage/to-streamable-file';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { ListVendorsQueryDto } from '../dto/list-vendors.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import type { VendorPaymentDetails } from '../entities/vendor-payment-details.entity';
import type { Vendor } from '../entities/vendor.entity';
import { VendorsDocs } from '../vendors.docs';
import { PaymentDetailsService } from '../services/payment-details.service';
import { VendorsService } from '../services/vendors.service';

@VendorsDocs.controller()
@Auth(UserRole.Admin)
@SerializeOptions({ groups: [UserRole.Admin] })
@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendors: VendorsService,
    private readonly paymentDetails: PaymentDetailsService,
  ) {}

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

  /* read-only for admins: the vendor maintains these in its portal */
  @Get(':id/payment-details')
  @VendorsDocs.paymentDetails()
  async findPaymentDetails(
    @Param() { id }: IdParamDto,
  ): Promise<VendorPaymentDetails> {
    await this.vendors.findById(id);
    return this.paymentDetails.find(id);
  }

  @Get(':id/payment-details/qr')
  @VendorsDocs.paymentQr()
  async paymentQr(@Param() { id }: IdParamDto): Promise<StreamableFile> {
    return toStreamableFile(await this.paymentDetails.openQr(id));
  }
}
