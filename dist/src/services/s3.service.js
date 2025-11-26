"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToS3 = uploadBufferToS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
});
async function uploadBufferToS3(params) {
    const { bucket, key, body, contentType } = params;
    await s3.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    const publicUrlBase = process.env.S3_PUBLIC_URL_BASE;
    if (publicUrlBase)
        return `${publicUrlBase.replace(/\/$/, '')}/${key}`;
    return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
}
