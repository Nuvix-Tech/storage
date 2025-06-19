export interface DeviceMetadata {
    [key: string]: any;
}

export abstract class Device {
    /**
     * Max chunk size while transferring file from one device to another
     */
    protected transferChunkSize: number = 20000000; // 20 MB

    /**
     * Sets the maximum number of keys returned to the response. By default, the action returns up to 1,000 key names.
     */
    protected static readonly MAX_PAGE_SIZE: number = Number.MAX_SAFE_INTEGER;

    /**
     * Set Transfer Chunk Size
     */
    public setTransferChunkSize(chunkSize: number): void {
        this.transferChunkSize = chunkSize;
    }

    /**
     * Get Transfer Chunk Size
     */
    public getTransferChunkSize(): number {
        return this.transferChunkSize;
    }

    /**
     * Get Name.
     *
     * Get storage device name
     */
    abstract getName(): string;

    /**
     * Get Type.
     *
     * Get storage device type
     */
    abstract getType(): string;

    /**
     * Get Description.
     *
     * Get storage device description and purpose.
     */
    abstract getDescription(): string;

    /**
     * Get Root.
     *
     * Get storage device root path
     */
    abstract getRoot(): string;

    /**
     * Get Path.
     *
     * Each device hold a complex directory structure that is being build in this method.
     */
    abstract getPath(filename: string, prefix?: string): string;

    /**
     * Upload.
     *
     * Upload a file to desired destination in the selected disk
     * return number of chunks uploaded or 0 if it fails.
     */
    abstract upload(
        source: string,
        path: string,
        chunk?: number,
        chunks?: number,
        metadata?: DeviceMetadata
    ): Promise<number>;

    /**
     * Upload Data.
     *
     * Upload file contents to desired destination in the selected disk.
     * return number of chunks uploaded or 0 if it fails.
     */
    abstract uploadData(
        data: string | Buffer,
        path: string,
        contentType: string,
        chunk?: number,
        chunks?: number,
        metadata?: DeviceMetadata
    ): Promise<number>;

    /**
     * Abort Chunked Upload
     */
    abstract abort(path: string, extra?: string): Promise<boolean>;

    /**
     * Read file by given path.
     */
    abstract read(path: string, offset?: number, length?: number): Promise<Buffer>;

    /**
     * Transfer
     * Transfer a file from current device to destination device.
     */
    abstract transfer(path: string, destination: string, device: Device): Promise<boolean>;

    /**
     * Write file by given path.
     */
    abstract write(path: string, data: string | Buffer, contentType: string): Promise<boolean>;

    /**
     * Move file from given source to given path, return true on success and false on failure.
     */
    public async move(source: string, target: string): Promise<boolean> {
        if (source === target) {
            return false;
        }

        if (await this.transfer(source, target, this)) {
            return await this.delete(source);
        }

        return false;
    }

    /**
     * Delete file in given path return true on success and false on failure.
     */
    abstract delete(path: string, recursive?: boolean): Promise<boolean>;

    /**
     * Delete files in given path, path must be a directory. return true on success and false on failure.
     */
    abstract deletePath(path: string): Promise<boolean>;

    /**
     * Check if file exists
     */
    abstract exists(path: string): Promise<boolean>;

    /**
     * Returns given file path its size.
     */
    abstract getFileSize(path: string): Promise<number>;

    /**
     * Returns given file path its mime type.
     */
    abstract getFileMimeType(path: string): Promise<string>;

    /**
     * Returns given file path its MD5 hash value.
     */
    abstract getFileHash(path: string): Promise<string>;

    /**
     * Create a directory at the specified path.
     *
     * Returns true on success or if the directory already exists and false on error
     */
    abstract createDirectory(path: string): Promise<boolean>;

    /**
     * Get directory size in bytes.
     *
     * Return -1 on error
     */
    abstract getDirectorySize(path: string): Promise<number>;

    /**
     * Get Partition Free Space.
     *
     * Returns available space on filesystem or disk partition
     */
    abstract getPartitionFreeSpace(): Promise<number>;

    /**
     * Get Partition Total Space.
     *
     * Returns the total size of a filesystem or disk partition
     */
    abstract getPartitionTotalSpace(): Promise<number>;

    /**
     * Get all files and directories inside a directory.
     */
    abstract getFiles(
        dir: string,
        max?: number,
        continuationToken?: string
    ): Promise<any[]>;

    /**
     * Get the absolute path by resolving strings like ../, .., //, /\ and so on.
     *
     * Works like the realpath function but works on files that does not exist
     */
    public getAbsolutePath(path: string): string {
        const normalizedPath = path.replace(/[/\\]/g, '/');
        const parts = normalizedPath.split('/').filter(part => part.length > 0);

        const absolutes: string[] = [];
        for (const part of parts) {
            if (part === '.') {
                continue;
            }
            if (part === '..') {
                absolutes.pop();
            } else {
                absolutes.push(part);
            }
        }

        return '/' + absolutes.join('/');
    }

    protected async getMimeType(filePath: string): Promise<string> {
        const path = await import('path');
        
        // Node.js doesn't have a built-in MIME type module, so we'll use a comprehensive mapping
        const ext = path.extname(filePath).toLowerCase().slice(1);
        const mimeTypes: Record<string, string> = {
            // Text
            'txt': 'text/plain',
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'csv': 'text/csv',
            'xml': 'text/xml',
            
            // JavaScript
            'js': 'application/javascript',
            'mjs': 'application/javascript',
            'json': 'application/json',
            
            // Images
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'tif': 'image/tiff',
            
            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            
            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            
            // Video
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'wmv': 'video/x-ms-wmv',
            'flv': 'video/x-flv',
            'webm': 'video/webm',
            
            // Archives
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'tar': 'application/x-tar',
            'gz': 'application/gzip',
            '7z': 'application/x-7z-compressed',
            
            // Other
            'bin': 'application/octet-stream',
            'exe': 'application/octet-stream',
            'dmg': 'application/octet-stream'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
