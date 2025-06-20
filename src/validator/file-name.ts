import { Validator } from "./validator";

export class FileName extends Validator {
  /**
   * Get Description
   */
  getDescription(): string {
    return "Filename is not valid";
  }

  /**
   * The file name can only contain "a-z", "A-Z", "0-9" and "." and not empty.
   *
   * @param name - The filename to validate
   * @returns boolean indicating if the filename is valid
   */
  isValid(name: any): boolean {
    if (!name) {
      return false;
    }

    if (typeof name !== "string") {
      return false;
    }

    if (!/^[a-zA-Z0-9.]+$/.test(name)) {
      return false;
    }

    return true;
  }
}
