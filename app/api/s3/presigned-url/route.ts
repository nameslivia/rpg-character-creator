import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrlForView } from "@/lib/s3";

export async function POST(request: NextRequest) {
    try {
        const { s3Url } = await request.json();

        if (!s3Url) {
            return NextResponse.json(
                { error: "Missing S3 URL" },
                { status: 400 }
            );
        }

        const presignedUrl = await getPresignedUrlForView(s3Url);

        return NextResponse.json({
            success: true,
            url: presignedUrl,
        });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate URL" },
            { status: 500 }
        );
    }
}

