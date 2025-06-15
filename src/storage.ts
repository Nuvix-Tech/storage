import { Device } from "./device";

export class Storage {
    /**
     * Supported devices
     */
    static readonly DEVICE_LOCAL = 'local';
    static readonly DEVICE_S3 = 's3';
    // static readonly DEVICE_DO_SPACES = 'dospaces';
    static readonly DEVICE_WASABI = 'wasabi';
    // static readonly DEVICE_BACKBLAZE = 'backblaze';
    // static readonly DEVICE_LINODE = 'linode';

    /**
     * Devices.
     *
     * List of all available storage devices
     */
    private static devices: Map<string, Device> = new Map();

    /**
     * Set Device.
     *
     * Add device by name
     *
     * @param name
     * @param device
     * @throws Error
     */
    static setDevice(name: string, device: Device): void {
        this.devices.set(name, device);
    }

    /**
     * Get Device.
     *
     * Get device by name
     *
     * @param name
     * @returns Device
     * @throws Error
     */
    static getDevice(name: string): Device {
        if (!this.devices.has(name)) {
            throw new Error(`The device "${name}" is not listed`);
        }

        return this.devices.get(name)!;
    }

    /**
     * Exists.
     *
     * Checks if given storage name is registered or not
     *
     * @param name
     * @returns boolean
     */
    static exists(name: string): boolean {
        return this.devices.has(name);
    }

    /**
     * Human readable data size format from bytes input.
     *
     * Based on: https://stackoverflow.com/a/38659168/2299554
     *
     * @param bytes
     * @param decimals
     * @param system
     * @returns string
     */
    static human(bytes: number, decimals: number = 2, system: 'binary' | 'metric' = 'metric'): string {
        const mod = system === 'binary' ? 1024 : 1000;

        const units = {
            binary: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'],
            metric: ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        };

        const factor = Math.floor((bytes.toString().length - 1) / 3);

        return `${(bytes / Math.pow(mod, factor)).toFixed(decimals)}${units[system][factor]}`;
    }
}