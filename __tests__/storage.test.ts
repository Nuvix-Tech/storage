import { Storage } from '../src/storage';
import { Local } from '../src/device/local';
import { Wasabi } from '../src/device/wasabi';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('Storage', () => {
    let tempDir: string;
    let localDevice: Local;
    let wasabiDevice: Wasabi;

    beforeAll(async () => {
        // Create temporary directory for local tests
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-test-'));

        // Initialize devices
        localDevice = new Local(tempDir);

        // Initialize Wasabi device with test credentials
        // Note: You'll need to set these environment variables or replace with your actual credentials
        wasabiDevice = new Wasabi(
            'test-storage',
            process.env.WASABI_ACCESS_KEY || 'your-access-key',
            process.env.WASABI_SECRET_KEY || 'your-secret-key',
            process.env.WASABI_BUCKET || 'your-bucket',
            Wasabi.US_CENTRAL_1
        );
    });

    afterAll(async () => {
        // Clean up temporary directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    beforeEach(() => {
        // Clear devices map before each test
        (Storage as any).devices = new Map();
    });

    describe('Constants', () => {
        test('should have correct device constants', () => {
            expect(Storage.DEVICE_LOCAL).toBe('local');
            expect(Storage.DEVICE_S3).toBe('s3');
            expect(Storage.DEVICE_WASABI).toBe('wasabi');
        });
    });

    describe('setDevice', () => {
        test('should set a local device correctly', () => {
            Storage.setDevice('local-test', localDevice);
            expect(Storage.exists('local-test')).toBe(true);
        });

        test('should set a Wasabi device correctly', () => {
            Storage.setDevice('wasabi-test', wasabiDevice);
            expect(Storage.exists('wasabi-test')).toBe(true);
        });

        test('should overwrite existing device', () => {
            const device1 = new Local(tempDir);
            const device2 = new Local(tempDir);

            Storage.setDevice('test', device1);
            Storage.setDevice('test', device2);

            expect(Storage.getDevice('test')).toBe(device2);
        });
    });

    describe('getDevice', () => {
        test('should get existing local device', () => {
            Storage.setDevice('local-test', localDevice);
            expect(Storage.getDevice('local-test')).toBe(localDevice);
        });

        test('should get existing Wasabi device', () => {
            Storage.setDevice('wasabi-test', wasabiDevice);
            expect(Storage.getDevice('wasabi-test')).toBe(wasabiDevice);
        });

        test('should throw error for non-existing device', () => {
            expect(() => Storage.getDevice('nonexistent')).toThrow('The device "nonexistent" is not listed');
        });
    });

    describe('exists', () => {
        test('should return true for existing device', () => {
            Storage.setDevice('test', localDevice);
            expect(Storage.exists('test')).toBe(true);
        });

        test('should return false for non-existing device', () => {
            expect(Storage.exists('nonexistent')).toBe(false);
        });
    });

    describe('human', () => {
        test('should format bytes to human readable format with metric system', () => {
            expect(Storage.human(0)).toBe('0.00B');
            expect(Storage.human(1000)).toBe('1.00kB');
            expect(Storage.human(1000000)).toBe('1.00MB');
            expect(Storage.human(1000000000)).toBe('1.00GB');
            expect(Storage.human(1000000000000)).toBe('1.00TB');
        });

        test('should format bytes to human readable format with binary system', () => {
            expect(Storage.human(0, 2, 'binary')).toBe('0.00B');
            expect(Storage.human(1024, 2, 'binary')).toBe('1.00KiB');
            expect(Storage.human(1048576, 2, 'binary')).toBe('1.00MiB');
            expect(Storage.human(1073741824, 2, 'binary')).toBe('1.00GiB');
        });

        test('should handle custom decimal places', () => {
            expect(Storage.human(1500, 0)).toBe('2kB');
            expect(Storage.human(1500, 1)).toBe('1.5kB');
            expect(Storage.human(1500, 3)).toBe('1.500kB');
        });

        test('should handle edge cases', () => {
            expect(Storage.human(1)).toBe('1.00B');
            expect(Storage.human(999)).toBe('999.00B');
            expect(Storage.human(1001)).toBe('1.00kB');
        });

        test('should handle very large numbers', () => {
            expect(Storage.human(1000000000000000)).toBe('1.00PB');
            expect(Storage.human(1000000000000000000)).toBe('1.00EB');
        });
    });

    describe('Integration Tests', () => {
        test('should register and use multiple devices', () => {
            Storage.setDevice(Storage.DEVICE_LOCAL, localDevice);
            Storage.setDevice(Storage.DEVICE_WASABI, wasabiDevice);

            expect(Storage.exists(Storage.DEVICE_LOCAL)).toBe(true);
            expect(Storage.exists(Storage.DEVICE_WASABI)).toBe(true);

            const retrievedLocal = Storage.getDevice(Storage.DEVICE_LOCAL);
            const retrievedWasabi = Storage.getDevice(Storage.DEVICE_WASABI);

            expect(retrievedLocal.getType()).toBe(Storage.DEVICE_LOCAL);
            expect(retrievedWasabi.getType()).toBe(Storage.DEVICE_WASABI);
        });
    });
});
