import { Validator } from "./validator.js";

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
    if (typeof fileSize !== "number" || !Number.isInteger(fileSize)) {
      return false;
    }

    if (fileSize > this.max || fileSize < 0) {
      return false;
    }

    return true;
  }
}
