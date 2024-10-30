import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Đọc biến môi trường từ .env
    UploadModule,
  ],
})
export class AppModule {}
