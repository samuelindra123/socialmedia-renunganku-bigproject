import { Injectable, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SpacesService {
    private readonly s3: AWS.S3;
    private readonly bucketName: string;

    constructor() {
        if (!process.env.DO_SPACES_ENDPOINT) {
            throw new Error('DO_SPACES_ENDPOINT is not defined');
        }
        if (!process.env.DO_SPACES_KEY) {
            throw new Error('DO_SPACES_KEY is not defined');
        }
        if (!process.env.DO_SPACES_SECRET) {
            throw new Error('DO_SPACES_SECRET is not defined');
        }
        if (!process.env.DO_SPACES_BUCKET) {
            throw new Error('DO_SPACES_BUCKET is not defined');
        }

        this.bucketName = process.env.DO_SPACES_BUCKET;

        const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
        this.s3 = new AWS.S3({
            endpoint: spacesEndpoint.href,
            credentials: new AWS.Credentials({
                accessKeyId: process.env.DO_SPACES_KEY,
                secretAccessKey: process.env.DO_SPACES_SECRET,
            }),
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'profiles',
    ): Promise<string> {
        if (!file) {
            throw new BadRequestException('File tidak boleh kosong');
        }

        // Validate file type (only images)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('File harus berupa gambar (jpg, png, webp)');
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('Ukuran file maksimal 5MB');
        }

        const fileName = `${folder}/${Date.now()}-${file.originalname}`;

        const params = {
            Bucket: this.bucketName,
            Key: fileName,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype,
        };

        try {
            const result = await this.s3.upload(params).promise();
            return result.Location;
        } catch (error) {
            throw new BadRequestException('Gagal upload file ke server');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        const key = fileUrl.split('.com/')[1];

        const params = {
            Bucket: this.bucketName,
            Key: key,
        };

        await this.s3.deleteObject(params).promise();
    }
}
