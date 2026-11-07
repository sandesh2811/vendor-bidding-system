import type { INestApplicationContext } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

export const SUPER_ADMIN = {
  name: 'Mero Event Admin',
  email: 'admin@meroevent.com',
  password: 'Admin@12345',
};

export async function seedAdmin(app: INestApplicationContext): Promise<void> {
  await app.get(UsersService).createAdmin(SUPER_ADMIN);
}
