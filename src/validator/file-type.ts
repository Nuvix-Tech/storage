import { readFile } from "fs/promises";
import { Validator } from "./validator.js";

export class FileType extends Validator {
  /**
   * File Types Constants.
   */
  static readonly FILE_TYPE_JPEG = "jpeg";
  static readonly FILE_TYPE_GIF = "gif";
  static readonly FILE_TYPE_PNG = "png";
  static readonly FILE_TYPE_GZIP = "gz";

  /**
   * File Type Binaries.
   */
  private readonly types: Record<string, string> = {
    [FileType.FILE_TYPE_JPEG]: "\xFF\xD8\xFF",
    [FileType.FILE_TYPE_GIF]: "GIF",
    [FileType.FILE_TYPE_PNG]: "\x89\x50\x4e\x47\x0d\x0a",
    [FileType.FILE_TYPE_GZIP]: "application/x-gzip",
  };

  private readonly allowed: string[];

  constructor(allowed: string[]) {
    super();

    for (const key of allowed) {
      if (!(key in this.types)) {
        throw new Error("Unknown file mime type");
      }
    }

    this.allowed = allowed;
  }

  /**
   * Get Description
   */
  getDescription(): string {
    return "File mime-type is not allowed ";
  }

  /**
   * Is Valid.
   *
   * Binary check to finds whether a file is of valid type
   */
  async isValid(path: string): Promise<boolean> {
    try {
      const buffer = await readFile(path);

      // Calculate the maximum signature length needed
      const maxSignatureLength = Math.max(
        ...Object.values(this.types).map((sig) => sig.length),
      );
      const bytesToRead = Math.min(
        buffer.length,
        Math.max(8, maxSignatureLength),
      );
      const bytes = buffer.toString("binary", 0, bytesToRead);

      for (const key of this.allowed) {
        if (bytes.indexOf(this.types[key]) === 0) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}
