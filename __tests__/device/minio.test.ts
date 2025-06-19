import { MinIO } from '../../src/device/minio';
import { Storage } from '../../src/storage';

describe('MinIO', () => {
    let minio: MinIO;

    beforeEach(() => {
        minio = new MinIO(
            'test-root',
            'minioadmin',
            'minioadmin',
            'test-bucket',
            'localhost:9000',
            MinIO.ACL_PRIVATE,
            false
        );
    });

    test('getName() should return MinIO Storage', () => {
        expect(minio.getName()).toBe('MinIO Storage');
    });

    test('getType() should return correct device type', () => {
        expect(minio.getType()).toBe(Storage.DEVICE_MINIO);
    });

    test('getDescription() should return correct description', () => {
        expect(minio.getDescription()).toBe('MinIO S3-compatible object storage server');
    });

    test('getRoot() should return the root path', () => {
        expect(minio.getRoot()).toBe('test-root');
    });

    test('constructor should set correct host for HTTP', () => {
        const minioHttp = new MinIO(
            'test-root',
            'minioadmin',
            'minioadmin',
            'test-bucket',
            'localhost:9000',
            MinIO.ACL_PRIVATE,
            false
        );

        // Access the protected headers property for testing
        const headers = (minioHttp as any).headers;
        expect(headers['host']).toBe('test-bucket.localhost:9000');
    });

    test('constructor should set correct host for HTTPS', () => {
        const minioHttps = new MinIO(
            'test-root',
            'minioadmin',
            'minioadmin',
            'test-bucket',
            'play.min.io',
            MinIO.ACL_PRIVATE,
            true
        );

        const headers = (minioHttps as any).headers;
        expect(headers['host']).toBe('test-bucket.play.min.io');
    });

    test('constructor should handle endpoint with protocol', () => {
        const minioWithProtocol = new MinIO(
            'test-root',
            'minioadmin',
            'minioadmin',
            'test-bucket',
            'https://play.min.io',
            MinIO.ACL_PRIVATE,
            true
        );

        const headers = (minioWithProtocol as any).headers;
        expect(headers['host']).toBe('test-bucket.play.min.io');
    });
});
