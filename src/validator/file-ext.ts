import { Validator } from "./validator.js";

export class FileExt extends Validator {
  static readonly TYPE_JPEG = "jpeg";
  static readonly TYPE_JPG = "jpg";
  static readonly TYPE_GIF = "gif";
  static readonly TYPE_PNG = "png";
  static readonly TYPE_GZIP = "gz";
  static readonly TYPE_ZIP = "zip";

  private allowed: string[];

  constructor(allowed: string[]) {
    super();
    this.allowed = allowed;
  }

  getDescription(): string {
    return "File extension is not valid";
  }

  isValid(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return this.allowed.includes(ext);
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1) : "";
  }
}
