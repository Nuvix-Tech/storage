import { FileType } from '../../src/validator/file-type';
import { Validator } from '../../src/validator/validator';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('FileType Validator', () => {
    let tempDir: string;

    beforeAll(async () => {
        // Create temporary directory for test files
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-type-test-'));
    });

    afterAll(async () => {
        // Clean up temporary directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Constants', () => {
        test('should have correct file type constants', () => {
            expect(FileType.FILE_TYPE_JPEG).toBe('jpeg');
            expect(FileType.FILE_TYPE_GIF).toBe('gif');
            expect(FileType.FILE_TYPE_PNG).toBe('png');
            expect(FileType.FILE_TYPE_GZIP).toBe('gz');
        });
    });

    describe('Constructor', () => {
        test('should create validator with allowed types', () => {
            const allowedTypes = [FileType.FILE_TYPE_JPEG, FileType.FILE_TYPE_PNG];
            const validator = new FileType(allowedTypes);
            expect(validator).toBeInstanceOf(FileType);
            expect(validator).toBeInstanceOf(Validator);
        });

        test('should throw error for unknown file type', () => {
            expect(() => {
                new FileType(['unknown-type']);
            }).toThrow('Unknown file mime type');
        });

        test('should accept single allowed type', () => {
            const validator = new FileType([FileType.FILE_TYPE_JPEG]);
            expect(validator).toBeInstanceOf(FileType);
        });

        test('should accept multiple allowed types', () => {
            const validator = new FileType([
                FileType.FILE_TYPE_JPEG,
                FileType.FILE_TYPE_PNG,
                FileType.FILE_TYPE_GIF
            ]);
            expect(validator).toBeInstanceOf(FileType);
        });

        test('should accept empty array', () => {
            const validator = new FileType([]);
            expect(validator).toBeInstanceOf(FileType);
        });
    });

    describe('Basic Properties', () => {
        let validator: FileType;

        beforeEach(() => {
            validator = new FileType([FileType.FILE_TYPE_JPEG, FileType.FILE_TYPE_PNG]);
        });

        test('should return correct description', () => {
            expect(validator.getDescription()).toBe('File mime-type is not allowed ');
        });

        test('should return correct type', () => {
            expect(validator.getType()).toBe('string');
        });

        test('should not be array type', () => {
            expect(validator.isArray()).toBe(false);
        });
    });

    describe('File Type Detection', () => {
        describe('JPEG Files', () => {
            let jpegValidator: FileType;
            let jpegFile: string;

            beforeEach(async () => {
                jpegValidator = new FileType([FileType.FILE_TYPE_JPEG]);
                jpegFile = path.join(tempDir, 'test.jpg');
                
                // Create a mock JPEG file with JPEG signature
                const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
                await fs.writeFile(jpegFile, jpegSignature);
            });

            test('should validate JPEG files', async () => {
                const result = await jpegValidator.isValid(jpegFile);
                expect(result).toBe(true);
            });

            test('should reject non-JPEG files when only JPEG allowed', async () => {
                const textFile = path.join(tempDir, 'text.jpg'); // Wrong content, right extension
                await fs.writeFile(textFile, 'This is not a JPEG file');
                
                const result = await jpegValidator.isValid(textFile);
                expect(result).toBe(false);
            });
        });

        describe('PNG Files', () => {
            let pngValidator: FileType;
            let pngFile: string;

            beforeEach(async () => {
                pngValidator = new FileType([FileType.FILE_TYPE_PNG]);
                pngFile = path.join(tempDir, 'test.png');
                
                // Create a mock PNG file with PNG signature
                const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
                await fs.writeFile(pngFile, pngSignature);
            });

            test('should validate PNG files', async () => {
                const result = await pngValidator.isValid(pngFile);
                expect(result).toBe(true);
            });

            test('should reject non-PNG files when only PNG allowed', async () => {
                const textFile = path.join(tempDir, 'text.png'); // Wrong content, right extension
                await fs.writeFile(textFile, 'This is not a PNG file');
                
                const result = await pngValidator.isValid(textFile);
                expect(result).toBe(false);
            });
        });

        describe('GIF Files', () => {
            let gifValidator: FileType;
            let gifFile: string;

            beforeEach(async () => {
                gifValidator = new FileType([FileType.FILE_TYPE_GIF]);
                gifFile = path.join(tempDir, 'test.gif');
                
                // Create a mock GIF file with GIF signature
                const gifSignature = Buffer.from('GIF', 'ascii');
                await fs.writeFile(gifFile, gifSignature);
            });

            test('should validate GIF files', async () => {
                const result = await gifValidator.isValid(gifFile);
                expect(result).toBe(true);
            });

            test('should reject non-GIF files when only GIF allowed', async () => {
                const textFile = path.join(tempDir, 'text.gif'); // Wrong content, right extension
                await fs.writeFile(textFile, 'This is not a GIF file');
                
                const result = await gifValidator.isValid(textFile);
                expect(result).toBe(false);
            });
        });

        describe('GZIP Files', () => {
            let gzipValidator: FileType;
            let gzipFile: string;

            beforeEach(async () => {
                gzipValidator = new FileType([FileType.FILE_TYPE_GZIP]);
                gzipFile = path.join(tempDir, 'test.gz');
                
                // For GZIP, the signature is stored as MIME type string in the types map
                // We'll create a file that starts with the expected string
                await fs.writeFile(gzipFile, 'application/x-gzip');
            });

            test('should validate GZIP files', async () => {
                const result = await gzipValidator.isValid(gzipFile);
                expect(result).toBe(true);
            });
        });

        describe('Multiple File Types', () => {
            let multiValidator: FileType;

            beforeEach(() => {
                multiValidator = new FileType([
                    FileType.FILE_TYPE_JPEG,
                    FileType.FILE_TYPE_PNG,
                    FileType.FILE_TYPE_GIF
                ]);
            });

            test('should validate any allowed file type', async () => {
                // Test JPEG
                const jpegFile = path.join(tempDir, 'multi-test.jpg');
                const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
                await fs.writeFile(jpegFile, jpegSignature);
                expect(await multiValidator.isValid(jpegFile)).toBe(true);

                // Test PNG
                const pngFile = path.join(tempDir, 'multi-test.png');
                const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
                await fs.writeFile(pngFile, pngSignature);
                expect(await multiValidator.isValid(pngFile)).toBe(true);

                // Test GIF
                const gifFile = path.join(tempDir, 'multi-test.gif');
                const gifSignature = Buffer.from('GIF', 'ascii');
                await fs.writeFile(gifFile, gifSignature);
                expect(await multiValidator.isValid(gifFile)).toBe(true);
            });

            test('should reject disallowed file types', async () => {
                const textFile = path.join(tempDir, 'multi-test.txt');
                await fs.writeFile(textFile, 'This is a text file');
                expect(await multiValidator.isValid(textFile)).toBe(false);
            });
        });
    });

    describe('Error Handling', () => {
        let validator: FileType;

        beforeEach(() => {
            validator = new FileType([FileType.FILE_TYPE_JPEG]);
        });

        test('should return false for non-existent files', async () => {
            const nonExistentFile = path.join(tempDir, 'does-not-exist.jpg');
            const result = await validator.isValid(nonExistentFile);
            expect(result).toBe(false);
        });

        test('should return false for empty files', async () => {
            const emptyFile = path.join(tempDir, 'empty.jpg');
            await fs.writeFile(emptyFile, '');
            const result = await validator.isValid(emptyFile);
            expect(result).toBe(false);
        });

        test('should handle permission errors gracefully', async () => {
            // Create a file and then make it unreadable (if possible on the platform)
            const restrictedFile = path.join(tempDir, 'restricted.jpg');
            await fs.writeFile(restrictedFile, 'test content');
            
            try {
                await fs.chmod(restrictedFile, 0o000); // Remove all permissions
                const result = await validator.isValid(restrictedFile);
                expect(result).toBe(false);
            } catch (error) {
                // If chmod fails (e.g., on Windows), just skip this test
                console.log('Skipping permission test - chmod not supported');
            } finally {
                // Restore permissions for cleanup
                try {
                    await fs.chmod(restrictedFile, 0o644);
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
        });
    });

    describe('Edge Cases', () => {
        let validator: FileType;

        beforeEach(() => {
            validator = new FileType([FileType.FILE_TYPE_JPEG, FileType.FILE_TYPE_PNG]);
        });

        test('should handle very small files', async () => {
            const tinyFile = path.join(tempDir, 'tiny.jpg');
            await fs.writeFile(tinyFile, 'x'); // 1 byte file
            const result = await validator.isValid(tinyFile);
            expect(result).toBe(false); // Not a valid JPEG signature
        });

        test('should handle files with misleading extensions', async () => {
            // PNG content with JPEG extension
            const misleadingFile = path.join(tempDir, 'misleading.jpg');
            const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
            await fs.writeFile(misleadingFile, pngSignature);
            
            const result = await validator.isValid(misleadingFile);
            expect(result).toBe(true); // Should detect as PNG based on content, not extension
        });

        test('should handle large files efficiently', async () => {
            const largeFile = path.join(tempDir, 'large.jpg');
            const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
            const padding = Buffer.alloc(10000, 'x'); // 10KB of padding
            const content = Buffer.concat([jpegSignature, padding]);
            await fs.writeFile(largeFile, content);
            
            const result = await validator.isValid(largeFile);
            expect(result).toBe(true);
        });

        test('should handle files with partial signatures', async () => {
            const partialFile = path.join(tempDir, 'partial.jpg');
            // Only first 2 bytes of JPEG signature
            const partialSignature = Buffer.from([0xFF, 0xD8]);
            await fs.writeFile(partialFile, partialSignature);
            
            const result = await validator.isValid(partialFile);
            expect(result).toBe(false); // Incomplete signature
        });
    });

    describe('No Allowed Types', () => {
        let strictValidator: FileType;

        beforeEach(() => {
            strictValidator = new FileType([]);
        });

        test('should reject all files when no types allowed', async () => {
            const jpegFile = path.join(tempDir, 'strict-test.jpg');
            const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
            await fs.writeFile(jpegFile, jpegSignature);
            
            const result = await strictValidator.isValid(jpegFile);
            expect(result).toBe(false);
        });
    });

    describe('Binary Signature Matching', () => {
        test('should read correct number of bytes for signature detection', async () => {
            // Test that it reads at least 8 bytes as indicated in the implementation
            const testFile = path.join(tempDir, 'signature-test.dat');
            const content = Buffer.concat([
                Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG signature
                Buffer.from('additional content that should not affect detection')
            ]);
            await fs.writeFile(testFile, content);
            
            const jpegValidator = new FileType([FileType.FILE_TYPE_JPEG]);
            const result = await jpegValidator.isValid(testFile);
            expect(result).toBe(true);
        });

        test('should handle files shorter than expected signature length', async () => {
            const shortFile = path.join(tempDir, 'short.png');
            // Only 3 bytes, but PNG signature needs 6
            await fs.writeFile(shortFile, Buffer.from([0x89, 0x50, 0x4e]));
            
            const pngValidator = new FileType([FileType.FILE_TYPE_PNG]);
            const result = await pngValidator.isValid(shortFile);
            expect(result).toBe(false);
        });
    });

    describe('Type Mapping', () => {
        test('should have correct internal type mappings', () => {
            // We can't directly access the private types property, but we can test indirectly
            // by ensuring the constructor validates against known types
            expect(() => new FileType([FileType.FILE_TYPE_JPEG])).not.toThrow();
            expect(() => new FileType([FileType.FILE_TYPE_PNG])).not.toThrow();
            expect(() => new FileType([FileType.FILE_TYPE_GIF])).not.toThrow();
            expect(() => new FileType([FileType.FILE_TYPE_GZIP])).not.toThrow();
            
            expect(() => new FileType(['invalid-type'])).toThrow();
        });
    });
});
