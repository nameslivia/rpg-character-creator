"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { AlbumPhoto } from "@/lib/types";
import { PhotoCard } from "@/components/photo-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ImagePlus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { FILE_CONSTRAINTS } from "@/lib/validations/file-validation";

interface AlbumUploaderProps {
    photos: AlbumPhoto[];
    onChange: (photos: AlbumPhoto[]) => void;
}

export function AlbumUploader({ photos, onChange }: AlbumUploaderProps) {
    // 使用 ref 追蹤最新的 photos
    const photosRef = useRef(photos);

    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    // Upload single file
    const uploadFile = useCallback(async (file: File, photoId: string) => {
        onChange(
            photosRef.current.map((p) =>
                p.id === photoId ? { ...p, uploading: true } : p
            )
        );

        try {
            const presignedResponse = await fetch("/api/s3/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    size: file.size,
                }),
            });

            if (!presignedResponse.ok) {
                throw new Error("Failed to get presigned URL");
            }

            const { presignedUrl, key } = await presignedResponse.json();

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round(
                            (event.loaded / event.total) * 100
                        );
                        onChange(
                            photosRef.current.map((p) =>
                                p.id === photoId
                                    ? { ...p, progress: percentComplete, key }
                                    : p
                            )
                        );
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 204) {
                        onChange(
                            photosRef.current.map((p) =>
                                p.id === photoId
                                    ? {
                                          ...p,
                                          progress: 100,
                                          uploading: false,
                                          error: false,
                                          key,
                                      }
                                    : p
                            )
                        );
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Upload failed"));

                xhr.open("PUT", presignedUrl);
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.send(file);
            });
        } catch (error) {
            console.error("Upload error:", error);
            onChange(
                photosRef.current.map((p) =>
                    p.id === photoId
                        ? { ...p, uploading: false, progress: 0, error: true }
                        : p
                )
            );
            alert("Upload failed, please try again.");
        }
    }, [onChange]);

    const handleDelete = async (photoId: string) => {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) return;

        if (!confirm("Are you sure you want to delete this photo?")) return;

        if (photo.objectUrl) {
            URL.revokeObjectURL(photo.objectUrl);
        }

        onChange(
            photos.map((p) =>
                p.id === photoId ? { ...p, uploading: true } : p
            )
        );

        try {
            const response = await fetch("/api/s3/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: photo.key }),
            });

            if (!response.ok) throw new Error("Delete failed");

            onChange(photos.filter((p) => p.id !== photoId));
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete failed, please try again later.");
            onChange(
                photos.map((p) =>
                    p.id === photoId ? { ...p, uploading: false, error: true } : p
                )
            );
        }
    };

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length) {
                const newPhotos: AlbumPhoto[] = acceptedFiles.map((file) => ({
                    id: uuidv4(),
                    key: "",
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    objectUrl: URL.createObjectURL(file),
                    uploading: false,
                    progress: 0,
                    error: false,
                }));

                const updatedPhotos = [...photosRef.current, ...newPhotos];

                // 立即更新 ref，避免 uploadFile 使用舊的值
                photosRef.current = updatedPhotos;
                onChange(updatedPhotos);

                // 開始上傳
                newPhotos.forEach((photo, index) => {
                    uploadFile(acceptedFiles[index], photo.id);
                });
            }
        },
        [onChange, uploadFile]
    );

    const rejectedFiles = useCallback((fileRejections: FileRejection[]) => {
        if (fileRejections.length) {
            const tooManyFiles = fileRejections.find(
                (rejection) => rejection.errors[0].code === "too-many-files"
            );

            const fileSizeTooBig = fileRejections.find(
                (rejection) => rejection.errors[0].code === "file-too-large"
            );

            if (tooManyFiles) {
                alert(`Too many files selected, max is ${FILE_CONSTRAINTS.maxFiles}`);
            }

            if (fileSizeTooBig) {
                alert("File size exceeds 10MB limit");
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected: rejectedFiles,
        maxFiles: FILE_CONSTRAINTS.maxFiles,
        maxSize: 10 * 1024 * 1024,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
        },
    });

    // 只在元件卸載時清理 objectUrl
    useEffect(() => {
        return () => {
            photosRef.current.forEach((photo) => {
                if (photo.objectUrl) {
                    URL.revokeObjectURL(photo.objectUrl);
                }
            });
        };
    }, []); // 空依賴陣列，只在卸載時執行

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
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        hover:border-primary hover:bg-primary/5
                    `}
                >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {isDragActive ? 'Release to upload' : 'Drag and drop images here, or click to select files'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Supports JPG, PNG, WebP, GIF (up to 10MB)
                        </p>
                    </div>
                </div>

                {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onDelete={handleDelete}
                                isDeleting={photo.uploading}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
