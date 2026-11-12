import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';

export const AuthDocs = {
  controller: () => ApiTags('Auth'),

  login: () =>
    applyDecorators(
      ApiOperation({ summary: 'Log in and set the httpOnly session cookie' }),
      ApiOkResponse({ type: User }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
      ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
    ),

  logout: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Revoke the session and clear the cookie',
      }),
      ApiNoContentResponse(),
    ),

  me: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Current user, with its vendor for vendor logins',
      }),
      ApiOkResponse({ type: User }),
    ),
};
