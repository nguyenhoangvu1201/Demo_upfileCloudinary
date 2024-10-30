import { Controller, Post, UploadedFiles, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

// Cấu hình thư mục lưu trữ và tên file cho local uploads
const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Giới hạn kích thước file (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('upload')
export class UploadController {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Endpoint upload một file vào hệ thống cục bộ
  @Post('local')
  @UseInterceptors(FileInterceptor('file', { storage }))
  uploadLocal(@UploadedFile() file: Express.Multer.File) {
    console.log('File uploaded locally:', file);
    return {
      message: 'File uploaded successfully to local storage!',
      filename: file.filename,
      path: `/uploads/${file.filename}`,
    };
  }

  // Endpoint upload một file hoặc nhiều file lên Cloudinary
  @Post('cloudinary')
  @UseInterceptors(FilesInterceptor('files')) // Sử dụng FilesInterceptor cho cả hai trường hợp
  async upload(@UploadedFiles() files: Express.Multer.File[], @UploadedFile() file: Express.Multer.File) {
    let results: any[] = [];

    // Nếu có file đơn lẻ
    if (file) {
      files = [file]; // Đặt file đơn lẻ vào mảng files
    }

    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // Kiểm tra kích thước file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size too large: ${file.originalname}. Maximum is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
      }
    }

    try {
      const uploadPromises = files.map(file =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
            if (error) {
              console.error('Upload error:', error);
              return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            }
            resolve(result);
          });
          uploadStream.end(file.buffer);
        }),
      );

      results = await Promise.all(uploadPromises);
      console.log('Files uploaded to Cloudinary:', results);

      return {
        message: 'Files uploaded successfully to Cloudinary!',
        urls: results.map(result => result.secure_url),
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }
}