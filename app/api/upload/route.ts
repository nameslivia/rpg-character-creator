import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { validateFile } from "@/lib/validations/file-validation";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files were uploaded." },
                { status: 400 }
            );
        }

        const uploadResults = [];
        const errors = [];

        for (const file of files) {
            // 驗證檔案
            const validationError = validateFile(file);
            if (validationError) {
                errors.push({
                    fileName: file.name,
                    error: validationError,
                });
                continue;
            }

            try {
                // 將檔案轉換為 Buffer
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // 上傳到 S3
                const url = await uploadToS3(buffer, file.name, file.type);

                uploadResults.push({
                    id: crypto.randomUUID(),
                    url,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    uploadedAt: new Date().toISOString(),
                });
            } catch (error) {
                console.error(`File upload failed: ${file.name}`, error);
                errors.push({
                    fileName: file.name,
                    error: "Upload failed",
                });
            }
        }

        return NextResponse.json({
            success: true,
            uploads: uploadResults,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("Upload processing error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}

