"use client";

import { useState, useEffect } from "react";
import { AlbumPhoto } from "@/lib/types";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/validations/file-validation";

interface PhotoCardProps {
    photo: AlbumPhoto;
    onDelete: (photoId: string) => void;
    isDeleting?: boolean;
}

export function PhotoCard({ photo, onDelete, isDeleting = false }: PhotoCardProps) {
    const [s3Url, setS3Url] = useState<string>("");
    const [isLoadingS3, setIsLoadingS3] = useState(false);

    // 如果有 objectUrl（本地預覽），直接使用
    // 否則從 S3 key 產生 presigned URL
    useEffect(() => {
        async function loadS3Image() {
            if (photo.objectUrl || !photo.key) return;

            setIsLoadingS3(true);
            try {
                const response = await fetch("/api/presigned-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ s3Url: `s3://${process.env.NEXT_PUBLIC_S3_BUCKET || ""}/${photo.key}` }),
                });
                const data = await response.json();
                if (data.success) {
                    setS3Url(data.url);
                }
            } catch (error) {
                console.error("Failed to load image:", error);
            } finally {
                setIsLoadingS3(false);
            }
        }
        loadS3Image();
    }, [photo.key, photo.objectUrl]);

    const displayUrl = photo.objectUrl || s3Url;
    const isLoading = photo.uploading || isLoadingS3;

    return (
        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            {photo.progress !== undefined && photo.progress > 0 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="text-white font-medium text-lg">
                                        {photo.progress}%
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : displayUrl ? (
                        <img
                            src={displayUrl}
                            alt={photo.fileName}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Unable to load image
                        </div>
                    )}

                    {photo.error && (
                        <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                            <div className="text-white font-medium">Error</div>
                        </div>
                    )}

                    {/* Delete Button */}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(photo.id)}
                        disabled={isDeleting}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* File Info */}
                <div className="p-3 space-y-1">
                    <p className="text-xs font-medium truncate">{photo.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatFileSize(photo.fileSize)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

