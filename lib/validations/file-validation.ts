// 檔案驗證相關的常數和函數

export const FILE_CONSTRAINTS = {
    maxFiles: 20,                           // 最多 20 張照片
    maxFileSize: 5 * 1024 * 1024,          // 每個檔案 5MB
    maxTotalSize: 50 * 1024 * 1024,        // 總共 50MB
    allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
    ],
};

export interface FileValidationError {
    file: File;
    error: string;
}

/**
 * 驗證單個檔案
 */
export function validateFile(file: File): string | null {
    // 檢查檔案類型
    if (!FILE_CONSTRAINTS.allowedTypes.includes(file.type)) {
        return `Unsupported file type. Only accepts: ${FILE_CONSTRAINTS.allowedTypes.join(', ')}`;
    }

    // 檢查檔案大小
    if (file.size > FILE_CONSTRAINTS.maxFileSize) {
        const maxSizeMB = FILE_CONSTRAINTS.maxFileSize / (1024 * 1024);
        return `File is too large. Maximum allowed is ${maxSizeMB}MB`;
    }

    return null;
}

/**
 * 驗證多個檔案
 */
export function validateFiles(files: File[]): {
    valid: File[];
    errors: FileValidationError[];
} {
    const valid: File[] = [];
    const errors: FileValidationError[] = [];

    // 檢查檔案數量
    if (files.length > FILE_CONSTRAINTS.maxFiles) {
        return {
            valid: [],
            errors: [{
                file: files[0],
                error: `You can upload up to ${FILE_CONSTRAINTS.maxFiles} files only`
            }]
        };
    }

    // 驗證每個檔案
    files.forEach(file => {
        const error = validateFile(file);
        if (error) {
            errors.push({ file, error });
        } else {
            valid.push(file);
        }
    });

    // 檢查總大小
    const totalSize = valid.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > FILE_CONSTRAINTS.maxTotalSize) {
        const maxTotalSizeMB = FILE_CONSTRAINTS.maxTotalSize / (1024 * 1024);
        return {
            valid: [],
            errors: [{
                file: files[0],
                error: `Total file size exceeds the limit (${maxTotalSizeMB}MB)`
            }]
        };
    }

    return { valid, errors };
}

/**
 * 格式化檔案大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

