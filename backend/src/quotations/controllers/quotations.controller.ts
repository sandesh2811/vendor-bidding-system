import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Auth, CurrentUser } from '../../auth/auth.decorators';
import { QUOTATION_PHOTO, UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import type { Paginated } from '../../common/pagination.helper';
import {
  ImageFileValidator,
  type UploadedFileData,
} from '../../common/validators/image-file.validator';
import type { User } from '../../users/entities/user.entity';
import { AddRecipientsDto } from '../dto/add-recipients.dto';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { ListQuotationsQueryDto } from '../dto/list-quotations.dto';
import { PhotoParamDto } from '../dto/photo-param.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { toStreamableFile } from './photo-response';
import type { QuotationPhoto } from '../entities/quotation-photo.entity';
import type { Quotation } from '../entities/quotation.entity';
import { QuotationsDocs } from '../quotations.docs';
import { QuotationsService } from '../quotations.service';

@QuotationsDocs.controller()
@Auth(UserRole.Admin)
@SerializeOptions({ groups: [UserRole.Admin] })
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Post()
  @QuotationsDocs.create()
  create(
    @Body() dto: CreateQuotationDto,
    @CurrentUser() admin: User,
  ): Promise<Quotation> {
    return this.quotations.create(dto, admin.id);
  }

  @Get()
  @QuotationsDocs.findAll()
  findAll(
    @Query() query: ListQuotationsQueryDto,
  ): Promise<Paginated<Quotation>> {
    return this.quotations.findAll(query);
  }

  @Get(':id')
  @QuotationsDocs.findOne()
  findOne(@Param() { id }: IdParamDto): Promise<Quotation> {
    return this.quotations.findById(id);
  }

  @Patch(':id')
  @QuotationsDocs.update()
  update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateQuotationDto,
  ): Promise<Quotation> {
    return this.quotations.update(id, dto);
  }

  @Post(':id/recipients')
  @HttpCode(HttpStatus.OK)
  @QuotationsDocs.addRecipients()
  addRecipients(
    @Param() { id }: IdParamDto,
    @Body() { vendorIds }: AddRecipientsDto,
  ): Promise<Quotation> {
    return this.quotations.addRecipients(id, vendorIds);
  }

  /* memory storage: files are validated (size, magic number) before anything touches the disk */
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', QUOTATION_PHOTO.MAX_PER_QUOTATION, {
      limits: {
        fileSize: QUOTATION_PHOTO.MAX_BYTES,
        files: QUOTATION_PHOTO.MAX_PER_QUOTATION,
      },
    }),
  )
  @QuotationsDocs.uploadPhotos()
  uploadPhotos(
    @Param() { id }: IdParamDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: QUOTATION_PHOTO.MAX_BYTES }),
          new ImageFileValidator(),
        ],
      }),
    )
    files: UploadedFileData[],
  ): Promise<QuotationPhoto[]> {
    return this.quotations.addPhotos(id, files);
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @QuotationsDocs.removePhoto()
  removePhoto(@Param() { id, photoId }: PhotoParamDto): Promise<void> {
    return this.quotations.removePhoto(id, photoId);
  }

  @Get(':id/photos/:photoId')
  @QuotationsDocs.photoFile()
  async photoFile(
    @Param() { id, photoId }: PhotoParamDto,
  ): Promise<StreamableFile> {
    return toStreamableFile(await this.quotations.openPhoto(id, photoId));
  }
}
