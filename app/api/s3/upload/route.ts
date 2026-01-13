import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
    try {
        const { filename, contentType, size } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: "Missing filename or contentType" },
                { status: 400 }
            );
        }

        // 檢查檔案大小（最大 10MB）
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (size && size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        // 產生 presigned URL
        const { url: presignedUrl, key } = await generatePresignedUrl(
            filename,
            contentType
        );

        return NextResponse.json({
            presignedUrl,
            key,
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate presigned URL" },
            { status: 500 }
        );
    }
}

