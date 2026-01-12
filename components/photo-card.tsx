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
    const [imageUrl, setImageUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadImage() {
            // 如果是 s3:// 開頭，需要產生 presigned URL
            if (photo.url.startsWith("s3://")) {
                try {
                    const response = await fetch("/api/presigned-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ s3Url: photo.url }),
                    });
                    const data = await response.json();
                    if (data.success) {
                        setImageUrl(data.url);
                    }
                } catch (error) {
                    console.error("Failed to load image:", error);
                }
            } else {
                // 如果是 https:// 開頭，直接使用
                setImageUrl(photo.url);
            }
            setIsLoading(false);
        }
        loadImage();
    }, [photo.url]);

    return (
        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={photo.fileName}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Unable to load image
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

