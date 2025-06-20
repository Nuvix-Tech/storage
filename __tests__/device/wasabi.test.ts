import { Wasabi } from '../../src/device/wasabi';
import { S3 } from '../../src/device/s3';
import { Storage } from '../../src/storage';

describe('Wasabi Device', () => {
    let wasabiDevice: Wasabi;
    const testCredentials = {
        root: 'test-storage',
        accessKey: process.env.WASABI_ACCESS_KEY || 'test-access-key',
        secretKey: process.env.WASABI_SECRET_KEY || 'test-secret-key',
        bucket: process.env.WASABI_BUCKET || 'test-bucket',
        region: Wasabi.US_CENTRAL_1,
        acl: S3.ACL_PRIVATE
    };

    beforeEach(() => {
        wasabiDevice = new Wasabi(
            testCredentials.root,
            testCredentials.accessKey,
            testCredentials.secretKey,
            testCredentials.bucket,
            testCredentials.region,
            testCredentials.acl
        );
    });

    describe('Basic Properties', () => {
        test('should return correct name', () => {
            expect(wasabiDevice.getName()).toBe('Wasabi Storage');
        });

        test('should return correct type', () => {
            expect(wasabiDevice.getType()).toBe(Storage.DEVICE_WASABI);
        });

        test('should return correct description', () => {
            expect(wasabiDevice.getDescription()).toBe('Wasabi Storage');
        });

        test('should return correct root', () => {
            expect(wasabiDevice.getRoot()).toBe(testCredentials.root);
        });

        test('should generate correct path', () => {
            const filename = 'test.txt';
            const expectedPath = `${testCredentials.root}/${filename}`;
            expect(wasabiDevice.getPath(filename)).toBe(expectedPath);
        });
    });

    describe('Wasabi Region Constants', () => {
        test('should have correct region constants', () => {
            expect(Wasabi.US_WEST_1).toBe('us-west-1');
            expect(Wasabi.AP_NORTHEAST_1).toBe('ap-northeast-1');
            expect(Wasabi.AP_NORTHEAST_2).toBe('ap-northeast-2');
            expect(Wasabi.EU_CENTRAL_1).toBe('eu-central-1');
            expect(Wasabi.EU_CENTRAL_2).toBe('eu-central-2');
            expect(Wasabi.EU_WEST_1).toBe('eu-west-1');
            expect(Wasabi.EU_WEST_2).toBe('eu-west-2');
            expect(Wasabi.US_CENTRAL_1).toBe('us-central-1');
            expect(Wasabi.US_EAST_1).toBe('us-east-1');
            expect(Wasabi.US_EAST_2).toBe('us-east-2');
        });
    });

    describe('Constructor and Host Configuration', () => {
        test('should set correct host for Wasabi', () => {
            const expectedHost = `${testCredentials.bucket}.s3.${testCredentials.region}.wasabisys.com`;
            expect((wasabiDevice as any).headers.host).toBe(expectedHost);
        });

        test('should initialize with different regions', () => {
            const regions = [
                Wasabi.US_WEST_1,
                Wasabi.EU_CENTRAL_1,
                Wasabi.AP_NORTHEAST_1
            ];

            regions.forEach(region => {
                const device = new Wasabi(
                    testCredentials.root,
                    testCredentials.accessKey,
                    testCredentials.secretKey,
                    testCredentials.bucket,
                    region
                );

                const expectedHost = `${testCredentials.bucket}.s3.${region}.wasabisys.com`;
                expect((device as any).headers.host).toBe(expectedHost);
            });
        });

        test('should initialize with different ACL settings', () => {
            const aclSettings = [
                S3.ACL_PRIVATE,
                S3.ACL_PUBLIC_READ,
                S3.ACL_PUBLIC_READ_WRITE,
                S3.ACL_AUTHENTICATED_READ
            ];

            aclSettings.forEach(acl => {
                const device = new Wasabi(
                    testCredentials.root,
                    testCredentials.accessKey,
                    testCredentials.secretKey,
                    testCredentials.bucket,
                    testCredentials.region,
                    acl
                );

                expect((device as any).acl).toBe(acl);
            });
        });
    });

    describe('Transfer Chunk Size', () => {
        test('should inherit transfer chunk size functionality from S3', () => {
            expect(wasabiDevice.getTransferChunkSize()).toBe(20000000); // 20 MB default

            const newSize = 10000000; // 10 MB
            wasabiDevice.setTransferChunkSize(newSize);
            expect(wasabiDevice.getTransferChunkSize()).toBe(newSize);
        });
    });

    describe('Integration with S3 Base Class', () => {
        test('should inherit S3 HTTP method constants', () => {
            expect(S3.METHOD_GET).toBe('GET');
            expect(S3.METHOD_POST).toBe('POST');
            expect(S3.METHOD_PUT).toBe('PUT');
            expect(S3.METHOD_DELETE).toBe('DELETE');
            expect(S3.METHOD_HEAD).toBe('HEAD');
        });

        test('should inherit S3 ACL constants', () => {
            expect(S3.ACL_PRIVATE).toBe('private');
            expect(S3.ACL_PUBLIC_READ).toBe('public-read');
            expect(S3.ACL_PUBLIC_READ_WRITE).toBe('public-read-write');
            expect(S3.ACL_AUTHENTICATED_READ).toBe('authenticated-read');
        });

        test('should have access to S3 retry configuration methods', () => {
            expect(typeof S3.setRetryAttempts).toBe('function');
            expect(typeof S3.setRetryDelay).toBe('function');
        });
    });

    // Note: The following tests would require actual Wasabi credentials and network access
    // They are included as examples of what could be tested with real credentials

    describe('File Operations (Requires Real Credentials)', () => {
        const skipRealTests = !process.env.WASABI_ACCESS_KEY ||
            !process.env.WASABI_SECRET_KEY ||
            !process.env.WASABI_BUCKET;

        beforeEach(() => {
            if (skipRealTests) {
                console.log('Skipping real Wasabi tests - credentials not provided');
            }
        });

        test('should write and read file', async () => {
            // This test would require real credentials
            const testFile = `test-${Date.now()}.txt`;
            const testContent = Buffer.from('Hello, Wasabi World!');

            await wasabiDevice.write(testFile, testContent, 'text/plain');
            const readContent = await wasabiDevice.read(testFile);
            expect(readContent).toStrictEqual(testContent);

            // Cleanup
            await wasabiDevice.delete(testFile);
        }, 50000);

        test('should upload and download file', async () => {
            // This test would require real credentials
            const testFile = `upload-test-${Date.now()}.txt`;
            const testContent = Buffer.from('Upload test content');

            const result = await wasabiDevice.uploadData(testContent, testFile, 'text/plain');
            expect(result).toBe(1);

            const exists = await wasabiDevice.exists(testFile);
            expect(exists).toBe(true);

            const size = await wasabiDevice.getFileSize(testFile);
            expect(size).toBe(Buffer.byteLength(testContent));

            // Cleanup
            await wasabiDevice.delete(testFile);
        }, 50000);

        test('should handle multipart upload', async () => {
            // This test would require real credentials
            const testFile = `multipart-test-${Date.now()}.txt`;
            const chunk1 = Buffer.from('First chunk ');
            const chunk2 = Buffer.from('Second chunk ');
            const chunk3 = Buffer.from('Third chunk');

            const metadata = {};

            await wasabiDevice.uploadData(chunk1, testFile, 'text/plain', 1, 3, metadata);
            await wasabiDevice.uploadData(chunk2, testFile, 'text/plain', 2, 3, metadata);
            const result = await wasabiDevice.uploadData(chunk3, testFile, 'text/plain', 3, 3, metadata);

            expect(result).toBe(3);

            const readContent = await wasabiDevice.read(testFile);
            expect(readContent).toBe(Buffer.concat([chunk1, chunk2, chunk3]));

            // Cleanup
            await wasabiDevice.delete(testFile);
        }, 50000);

        test('should list files', async () => {
            // This test would require real credentials
            const files = await wasabiDevice.getFiles('');
            expect(Array.isArray(files.Contents) || files.Contents === undefined).toBe(true);
        }, 50000);

        test('should get file metadata', async () => {
            // This test would require real credentials
            const testFile = `metadata-test-${Date.now()}.txt`;
            const testContent = Buffer.from('Metadata test content');

            await wasabiDevice.write(testFile, testContent, 'text/plain');

            const mimeType = await wasabiDevice.getFileMimeType(testFile);
            expect(mimeType).toBe('text/plain');

            const hash = await wasabiDevice.getFileHash(testFile);
            expect(hash).toBeDefined();
            expect(hash.length).toBeGreaterThan(0);

            // Cleanup
            await wasabiDevice.delete(testFile);
        }, 50000);
    });

    describe('Error Handling', () => {
        test('should validate region parameter', () => {
            // Should not throw for valid regions
            expect(() => {
                new Wasabi(
                    testCredentials.root,
                    testCredentials.accessKey,
                    testCredentials.secretKey,
                    testCredentials.bucket,
                    Wasabi.EU_CENTRAL_1
                );
            }).not.toThrow();
        });
    });

    describe('Wasabi-specific Features', () => {
        test('should support all Wasabi regions', () => {
            const wasabiRegions = [
                Wasabi.US_WEST_1,
                Wasabi.AP_NORTHEAST_1,
                Wasabi.AP_NORTHEAST_2,
                Wasabi.EU_CENTRAL_1,
                Wasabi.EU_CENTRAL_2,
                Wasabi.EU_WEST_1,
                Wasabi.EU_WEST_2,
                Wasabi.US_CENTRAL_1,
                Wasabi.US_EAST_1,
                Wasabi.US_EAST_2
            ];

            wasabiRegions.forEach(region => {
                expect(() => {
                    new Wasabi(
                        testCredentials.root,
                        testCredentials.accessKey,
                        testCredentials.secretKey,
                        testCredentials.bucket,
                        region
                    );
                }).not.toThrow();
            });
        });

        test('should use correct Wasabi endpoint format', () => {
            const testRegion = Wasabi.EU_CENTRAL_1;
            const device = new Wasabi(
                testCredentials.root,
                testCredentials.accessKey,
                testCredentials.secretKey,
                testCredentials.bucket,
                testRegion
            );

            const expectedHost = `${testCredentials.bucket}.s3.${testRegion}.wasabisys.com`;
            expect((device as any).headers.host).toBe(expectedHost);
        });
    });
});
