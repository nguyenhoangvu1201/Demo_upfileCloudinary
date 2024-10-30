"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cloudinary_1 = require("cloudinary");
const multer_1 = require("multer");
const path_1 = require("path");
const config_1 = require("@nestjs/config");
const storage = (0, multer_1.diskStorage)({
    destination: './uploads',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = (0, path_1.extname)(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const MAX_FILE_SIZE = 10 * 1024 * 1024;
let UploadController = class UploadController {
    constructor(configService) {
        this.configService = configService;
        cloudinary_1.v2.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }
    uploadLocal(file) {
        console.log('File uploaded locally:', file);
        return {
            message: 'File uploaded successfully to local storage!',
            filename: file.filename,
            path: `/uploads/${file.filename}`,
        };
    }
    async upload(files, file) {
        let results = [];
        if (file) {
            files = [file];
        }
        if (!files || files.length === 0) {
            throw new Error('No files uploaded');
        }
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`File size too large: ${file.originalname}. Maximum is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
            }
        }
        try {
            const uploadPromises = files.map(file => new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream((error, result) => {
                    if (error) {
                        console.error('Upload error:', error);
                        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    }
                    resolve(result);
                });
                uploadStream.end(file.buffer);
            }));
            results = await Promise.all(uploadPromises);
            console.log('Files uploaded to Cloudinary:', results);
            return {
                message: 'Files uploaded successfully to Cloudinary!',
                urls: results.map(result => result.secure_url),
            };
        }
        catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        }
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('local'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadLocal", null);
__decorate([
    (0, common_1.Post)('cloudinary'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files')),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "upload", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map