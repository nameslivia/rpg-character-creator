import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 初始化 S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * 產生唯一的檔案名稱
 */
export function generateUniqueFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFileName.split('.').pop();
    return `character-album/${timestamp}-${randomString}.${extension}`;
}

/**
 * 上傳檔案到 S3
 */
export async function uploadToS3(
    file: Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    const key = generateUniqueFileName(fileName);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    await s3Client.send(command);

    // 返回 S3 key，前端會用它來產生 presigned URL
    // 格式：s3://bucket-name/key
    return `s3://${BUCKET_NAME}/${key}`;
}

/**
 * 從 S3 key 產生 presigned URL（用於顯示圖片）
 */
export async function getPresignedUrlForView(s3Url: string): Promise<string> {
    // 從 s3://bucket-name/key 提取 key
    const key = s3Url.replace(`s3://${BUCKET_NAME}/`, '');

    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    // 產生 7 天有效的 presigned URL
    const url = await getSignedUrl(s3Client, command, { expiresIn: 604800 });
    return url;
}

/**
 * 從 S3 刪除檔案
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
    // 從 URL 提取 key
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // 移除開頭的 '/'

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * 產生 presigned URL 用於直接上傳
 */
export async function generatePresignedUrl(
    fileName: string,
    contentType: string
): Promise<{ url: string; key: string }> {
    const key = generateUniqueFileName(fileName);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 小時有效

    return { url, key };
}

/**
 * 從 key 產生公開 URL
 */
export function getPublicUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

