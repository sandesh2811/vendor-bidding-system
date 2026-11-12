import { Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage';
import { LocalFileStorage } from './local-file.storage';

/* one binding for every module that stores files; swap useClass for an object-storage adapter, nothing else changes */
@Module({
  providers: [{ provide: FILE_STORAGE, useClass: LocalFileStorage }],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
