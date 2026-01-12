import { NextRequest, NextResponse } from "next/server";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get("url");

        if (!fileUrl) {
            return NextResponse.json(
                { error: "Missing file URL" },
                { status: 400 }
            );
        }

        // 從 S3 刪除檔案
        await deleteFromS3(fileUrl);

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}

