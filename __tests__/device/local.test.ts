import { Local } from '../../src/device/local';
import { Storage } from '../../src/storage';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('Local Device', () => {
    let tempDir: string;
    let localDevice: Local;
    let testFile: string;
    let testContent: string;

    beforeAll(async () => {
        // Create temporary directory for tests
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-device-test-'));
        testContent = 'Hello, World! This is test content.';
    });

    beforeEach(() => {
        localDevice = new Local(tempDir);
        testFile = path.join(tempDir, `test-${Date.now()}.txt`);
    });

    afterAll(async () => {
        // Clean up temporary directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Basic Properties', () => {
        test('should return correct name', () => {
            expect(localDevice.getName()).toBe('Local Storage');
        });

        test('should return correct type', () => {
            expect(localDevice.getType()).toBe(Storage.DEVICE_LOCAL);
        });

        test('should return correct description', () => {
            expect(localDevice.getDescription()).toBe('Adapter for Local storage that is in the physical or virtual machine or mounted to it.');
        });

        test('should return correct root', () => {
            expect(localDevice.getRoot()).toBe(tempDir);
        });

        test('should generate correct path', () => {
            const filename = 'test.txt';
            const expectedPath = localDevice.getAbsolutePath(path.join(tempDir, filename));
            expect(localDevice.getPath(filename)).toBe(expectedPath);
        });
    });

    describe('Transfer Chunk Size', () => {
        test('should have default transfer chunk size', () => {
            expect(localDevice.getTransferChunkSize()).toBe(20000000); // 20 MB
        });

        test('should allow setting transfer chunk size', () => {
            const newSize = 10000000; // 10 MB
            localDevice.setTransferChunkSize(newSize);
            expect(localDevice.getTransferChunkSize()).toBe(newSize);
        });
    });

    describe('File Operations', () => {
        test('should write and read file', async () => {
            await localDevice.write(testFile, testContent);
            const readContent = await localDevice.read(testFile);
            expect(readContent).toBe(testContent);
        });

        test('should check if file exists', async () => {
            expect(await localDevice.exists(testFile)).toBe(false);
            await localDevice.write(testFile, testContent);
            expect(await localDevice.exists(testFile)).toBe(true);
        });

        test('should get file size', async () => {
            await localDevice.write(testFile, testContent);
            const size = await localDevice.getFileSize(testFile);
            expect(size).toBe(Buffer.byteLength(testContent));
        });

        test('should get file hash', async () => {
            await localDevice.write(testFile, testContent);
            const hash = await localDevice.getFileHash(testFile);
            expect(hash).toBeDefined();
            expect(hash.length).toBe(32); // MD5 hash length
        });

        test('should get file mime type', async () => {
            await localDevice.write(testFile, testContent);
            const mimeType = await localDevice.getFileMimeType(testFile);
            expect(mimeType).toBe('text/plain'); // .txt files
        });

        test('should delete file', async () => {
            await localDevice.write(testFile, testContent);
            expect(await localDevice.exists(testFile)).toBe(true);
            
            await localDevice.delete(testFile);
            expect(await localDevice.exists(testFile)).toBe(false);
        });

        test('should move file', async () => {
            const sourceFile = testFile;
            const targetFile = path.join(tempDir, `moved-${Date.now()}.txt`);
            
            await localDevice.write(sourceFile, testContent);
            expect(await localDevice.exists(sourceFile)).toBe(true);
            
            await localDevice.move(sourceFile, targetFile);
            expect(await localDevice.exists(sourceFile)).toBe(false);
            expect(await localDevice.exists(targetFile)).toBe(true);
            
            const readContent = await localDevice.read(targetFile);
            expect(readContent).toBe(testContent);
        });

        test('should not move file to same location', async () => {
            await localDevice.write(testFile, testContent);
            const result = await localDevice.move(testFile, testFile);
            expect(result).toBe(false);
        });

        test('should read file with offset and length', async () => {
            await localDevice.write(testFile, testContent);
            const partialContent = await localDevice.read(testFile, 7, 5); // "World"
            expect(partialContent).toBe('World');
        });
    });

    describe('Upload Operations', () => {
        test('should upload file (single chunk)', async () => {
            const sourceFile = path.join(tempDir, 'source.txt');
            await fs.writeFile(sourceFile, testContent);
            
            const result = await localDevice.upload(sourceFile, testFile);
            expect(result).toBe(1);
            expect(await localDevice.exists(testFile)).toBe(true);
            
            const readContent = await localDevice.read(testFile);
            expect(readContent).toBe(testContent);
        });

        test('should upload data (single chunk)', async () => {
            const result = await localDevice.uploadData(testContent, testFile, 'text/plain');
            expect(result).toBe(1);
            expect(await localDevice.exists(testFile)).toBe(true);
            
            const readContent = await localDevice.read(testFile);
            expect(readContent).toBe(testContent);
        });

        test('should handle chunked upload', async () => {
            const chunk1 = 'Hello, ';
            const chunk2 = 'World!';
            const fullContent = chunk1 + chunk2;
            
            // Upload first chunk
            let result = await localDevice.uploadData(chunk1, testFile, 'text/plain', 1, 2);
            expect(result).toBe(1);
            
            // Upload second chunk
            result = await localDevice.uploadData(chunk2, testFile, 'text/plain', 2, 2);
            expect(result).toBe(2);
            
            // Check final content
            expect(await localDevice.exists(testFile)).toBe(true);
            const readContent = await localDevice.read(testFile);
            expect(readContent).toBe(fullContent);
        });
    });

    describe('Directory Operations', () => {
        test('should create directory', async () => {
            const dirPath = path.join(tempDir, 'test-dir');
            const result = await localDevice.createDirectory(dirPath);
            expect(result).toBe(true);
            expect(await localDevice.exists(dirPath)).toBe(true);
        });

        test('should get directory size', async () => {
            const dirPath = path.join(tempDir, 'size-test-dir');
            await localDevice.createDirectory(dirPath);
            
            // Add some files to the directory
            const file1 = path.join(dirPath, 'file1.txt');
            const file2 = path.join(dirPath, 'file2.txt');
            await localDevice.write(file1, 'content1');
            await localDevice.write(file2, 'content2');
            
            const size = await localDevice.getDirectorySize(dirPath);
            expect(size).toBeGreaterThan(0);
            expect(size).toBe(Buffer.byteLength('content1') + Buffer.byteLength('content2'));
        });

        test('should get files in directory', async () => {
            const dirPath = path.join(tempDir, 'list-test-dir');
            await localDevice.createDirectory(dirPath);
            
            // Add some files
            const file1 = path.join(dirPath, 'file1.txt');
            const file2 = path.join(dirPath, 'file2.txt');
            await localDevice.write(file1, 'content1');
            await localDevice.write(file2, 'content2');
            
            const files = await localDevice.getFiles(dirPath);
            expect(files.length).toBe(2);
            expect(files).toContain(file1);
            expect(files).toContain(file2);
        });

        test('should delete directory recursively', async () => {
            const dirPath = path.join(tempDir, 'delete-test-dir');
            await localDevice.createDirectory(dirPath);
            
            // Add a file to the directory
            const file = path.join(dirPath, 'file.txt');
            await localDevice.write(file, 'content');
            
            const result = await localDevice.delete(dirPath, true);
            expect(result).toBe(true);
            expect(await localDevice.exists(dirPath)).toBe(false);
        });

        test('should delete path with deletePath method', async () => {
            const dirPath = path.join(tempDir, 'deletepath-test-dir');
            await localDevice.createDirectory(dirPath);
            
            // Add files and subdirectories
            const file1 = path.join(dirPath, 'file1.txt');
            const subDir = path.join(dirPath, 'subdir');
            const file2 = path.join(subDir, 'file2.txt');
            
            await localDevice.write(file1, 'content1');
            await localDevice.createDirectory(subDir);
            await localDevice.write(file2, 'content2');
            
            const relativePath = path.relative(tempDir, dirPath);
            const result = await localDevice.deletePath(relativePath);
            expect(result).toBe(true);
            expect(await localDevice.exists(dirPath)).toBe(false);
        });
    });

    describe('Partition Operations', () => {
        test('should get partition free space', async () => {
            const freeSpace = await localDevice.getPartitionFreeSpace();
            expect(freeSpace).toBeGreaterThan(0);
        });

        test('should get partition total space', async () => {
            const totalSpace = await localDevice.getPartitionTotalSpace();
            expect(totalSpace).toBeGreaterThan(0);
        });
    });

    describe('Transfer Operations', () => {
        test('should transfer file to another device', async () => {
            // Create source file
            await localDevice.write(testFile, testContent);
            
            // Create target device (another local device with different root)
            const targetTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'target-device-test-'));
            const targetDevice = new Local(targetTempDir);
            const targetFile = path.join(targetTempDir, 'transferred.txt');
            
            try {
                // Transfer file
                const result = await localDevice.transfer(testFile, targetFile, targetDevice);
                expect(result).toBe(true);
                
                // Verify transfer
                expect(await targetDevice.exists(targetFile)).toBe(true);
                const transferredContent = await targetDevice.read(targetFile);
                expect(transferredContent).toBe(testContent);
            } finally {
                // Clean up target directory
                await fs.rm(targetTempDir, { recursive: true, force: true });
            }
        });
    });

    describe('Abort Operations', () => {
        test('should abort chunked upload', async () => {
            // Start a chunked upload
            await localDevice.uploadData('chunk1', testFile, 'text/plain', 1, 3);
            
            // Abort the upload
            const result = await localDevice.abort(testFile);
            expect(result).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should throw error when reading non-existent file', async () => {
            await expect(localDevice.read('/nonexistent/file.txt')).rejects.toThrow('File Not Found');
        });

        test('should throw error when transferring non-existent file', async () => {
            const targetDevice = new Local(tempDir);
            await expect(localDevice.transfer('/nonexistent/file.txt', '/target.txt', targetDevice))
                .rejects.toThrow('File Not Found');
        });

        test('should handle upload errors gracefully', async () => {
            // Try to upload to invalid path
            await expect(localDevice.upload('/nonexistent/source.txt', testFile))
                .rejects.toThrow();
        });
    });

    describe('Path Utilities', () => {
        test('should resolve absolute paths correctly', () => {
            expect(localDevice.getAbsolutePath('/path/to/../file.txt')).toBe('/path/file.txt');
            expect(localDevice.getAbsolutePath('/path/./file.txt')).toBe('/path/file.txt');
            expect(localDevice.getAbsolutePath('//double//slash')).toBe('/double/slash');
            expect(localDevice.getAbsolutePath('/path/to/../../file.txt')).toBe('/file.txt');
        });
    });
});
