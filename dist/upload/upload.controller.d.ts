import { ConfigService } from '@nestjs/config';
export declare class UploadController {
    private configService;
    constructor(configService: ConfigService);
    uploadLocal(file: Express.Multer.File): {
        message: string;
        filename: string;
        path: string;
    };
    upload(files: Express.Multer.File[], file: Express.Multer.File): Promise<{
        message: string;
        urls: any[];
    }>;
}
