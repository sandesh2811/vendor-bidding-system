import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { VendorPageDto } from './dto/list-vendors.dto';
import { Vendor } from './vendor.entity';

export const VendorsDocs = {
  controller: () => ApiTags('Vendors (admin)'),

  create: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Create a vendor and its portal login (idempotent on phone + login email)',
      }),
      ApiCreatedResponse({
        type: Vendor,
        description: 'Created, or the existing vendor on a repeat',
      }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
      ApiConflictResponse({
        description:
          'Phone belongs to another vendor, or login email already used',
      }),
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'List vendors (paginated, filterable)' }),
      ApiOkResponse({ type: VendorPageDto }),
      ApiBadRequestResponse({ description: 'Invalid query' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a vendor' }),
      ApiOkResponse({ type: Vendor }),
      ApiNotFoundResponse({ description: 'Vendor not found' }),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: 'Edit a vendor; isActive=false deactivates it' }),
      ApiOkResponse({ type: Vendor }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
      ApiNotFoundResponse({ description: 'Vendor not found' }),
    ),
};
