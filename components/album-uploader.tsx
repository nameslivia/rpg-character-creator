"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { AlbumPhoto } from "@/lib/types";
import { PhotoCard } from "@/components/photo-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, ImagePlus } from "lucide-react";
import { validateFiles, FILE_CONSTRAINTS } from "@/lib/validations/file-validation";

interface AlbumUploaderProps {
    photos: AlbumPhoto[];
    onChange: (photos: AlbumPhoto[]) => void;
}

export function AlbumUploader({ photos, onChange }: AlbumUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

    // 處理檔案上傳
    const handleUpload = async (files: File[]) => {
        // 驗證檔案
        const { valid, errors } = validateFiles(files);

        if (errors.length > 0) {
            alert(errors.map(e => `${e.file.name}: ${e.error}`).join('\n'));
            return;
        }

        if (valid.length === 0) return;

        setIsUploading(true);
        setUploadProgress(`Uploading... 0/${valid.length}`);

        try {
            const formData = new FormData();
            valid.forEach(file => {
                formData.append("files", file);
            });

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.uploads) {
                // 將上傳的檔案加入相簿
                const newPhotos: AlbumPhoto[] = data.uploads.map((upload: any) => ({
                    ...upload,
                    uploadedAt: new Date(upload.uploadedAt),
                }));

                onChange([...photos, ...newPhotos]);
                setUploadProgress(`Successfully uploaded ${newPhotos.length} photos!`);
                
                setTimeout(() => setUploadProgress(""), 2000);
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error) {
            alert("Upload failed, please try again later.");
        } finally {
            setIsUploading(false);
        }
    };

    // 處理刪除照片
    const handleDelete = async (photoId: string) => {
        const photo = photos.find(p => p.id === photoId);
        if (!photo) return;

        if (!confirm("Are you sure you want to delete this photo?")) return;

        setDeletingPhotoId(photoId);

        try {
            const response = await fetch(
                `/api/delete?url=${encodeURIComponent(photo.url)}`,
                { method: "DELETE" }
            );

            if (response.ok) {
                onChange(photos.filter(p => p.id !== photoId));
            } else {
                throw new Error("Delete failed");
            }
        } catch (error) {
            alert("Delete failed, please try again later.");
        } finally {
            setDeletingPhotoId(null);
        }
    };

    // Dropzone 設定
    const onDrop = useCallback((acceptedFiles: File[]) => {
        handleUpload(acceptedFiles);
    }, [photos]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
        },
        maxFiles: FILE_CONSTRAINTS.maxFiles,
        disabled: isUploading,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <ImagePlus className="h-5 w-5" />
                        Character Progress Album
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {photos.length} / {FILE_CONSTRAINTS.maxFiles}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Area */}
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
                    `}
                >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {isUploading ? (
                        <div className="space-y-2">
                            <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                {isDragActive ? 'Release to upload' : 'Drag and drop images here, or click to select files'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supports JPG, PNG, WebP, GIF (up to 5MB)
                            </p>
                        </div>
                    )}
                </div>

                {/* photo grid */}
                {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onDelete={handleDelete}
                                isDeleting={deletingPhotoId === photo.id}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

