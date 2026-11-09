import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { Auth, CurrentVendor } from '../../auth/auth.decorators';
import { UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { Paginated } from '../../common/pagination.helper';
import type { Vendor } from '../../vendors/entities/vendor.entity';
import { DeclineQuotationDto } from '../dto/decline-quotation.dto';
import type { ReceivedQuotationDto } from '../dto/list-quotations.dto';
import { PhotoParamDto } from '../dto/photo-param.dto';
import { toStreamableFile } from './photo-response';
import { VendorQuotationsDocs } from '../quotations.docs';
import { QuotationsService } from '../quotations.service';

/* vendor portal: every query is scoped by the session's vendor, never by an id from the request */
@VendorQuotationsDocs.controller()
@Auth(UserRole.Vendor)
@Controller('vendor/quotations')
export class VendorQuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  @VendorQuotationsDocs.findAll()
  findAll(
    @CurrentVendor() vendor: Vendor,
    @Query() page: PaginationQueryDto,
  ): Promise<Paginated<ReceivedQuotationDto>> {
    return this.quotations.findReceived(vendor.id, page);
  }

  @Get(':id')
  @VendorQuotationsDocs.findOne()
  findOne(
    @CurrentVendor() vendor: Vendor,
    @Param() { id }: IdParamDto,
  ): Promise<ReceivedQuotationDto> {
    return this.quotations.findReceivedById(vendor.id, id);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @VendorQuotationsDocs.decline()
  decline(
    @CurrentVendor() vendor: Vendor,
    @Param() { id }: IdParamDto,
    @Body() { reason = null }: DeclineQuotationDto,
  ): Promise<ReceivedQuotationDto> {
    return this.quotations.decline(vendor.id, id, reason || null);
  }

  @Get(':id/photos/:photoId')
  @VendorQuotationsDocs.photoFile()
  async photoFile(
    @CurrentVendor() vendor: Vendor,
    @Param() { id, photoId }: PhotoParamDto,
  ): Promise<StreamableFile> {
    return toStreamableFile(
      await this.quotations.openReceivedPhoto(vendor.id, id, photoId),
    );
  }
}
