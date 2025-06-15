import { Validator } from "./validator";
import { promises as fs } from 'fs';

export class Upload extends Validator {
    /**
     * Get Description
     */
    getDescription(): string {
        return 'Not a valid upload file';
    }

    /**
     * Check if a file is a valid upload file
     *
     * @param path - The file path to validate
     * @returns Promise that resolves to true if valid upload file, false otherwise
     */
    async isValid(path: unknown): Promise<boolean> {
        if (typeof path !== 'string') {
            return false;
        }

        try {
            const stats = await fs.stat(path);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    /**
     * Is array
     *
     * Function will return true if object is array.
     *
     * @returns false - this validator doesn't handle arrays
     */
    isArray(): boolean {
        return false;
    }

    /**
     * Get Type
     *
     * Returns validator type.
     *
     * @returns The validator type
     */
    getType(): string {
        return 'string';
    }
}
