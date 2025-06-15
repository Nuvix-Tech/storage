import { Validator } from './validator';

export class FileSize extends Validator {
    private max: number;

    /**
     * Max size in bytes
     */
    constructor(max: number) {
        super();
        this.max = max;
    }

    /**
     * Get Description
     */
    getDescription(): string {
        return `File size can't be bigger than ${this.max}`;
    }

    /**
     * Finds whether a file size is smaller than required limit.
     */
    isValid(fileSize: any): boolean {
        if (typeof fileSize !== 'number' || !Number.isInteger(fileSize)) {
            return false;
        }

        if (fileSize > this.max) {
            return false;
        }

        return true;
    }

    /**
     * Is array
     *
     * Function will return true if object is array.
     */
    isArray(): boolean {
        return false;
    }

    /**
     * Get Type
     *
     * Returns validator type.
     */
    getType(): string {
        return Validator.TYPE_INTEGER;
    }
}