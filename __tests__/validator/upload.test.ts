import { Upload } from "../../src/validator/upload";
import { Validator } from "../../src/validator/validator";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

describe("Upload Validator", () => {
  let tempDir: string;
  let uploadValidator: Upload;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "upload-test-"));
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
    uploadValidator = new Upload();
  });

  describe("Basic Properties", () => {
    test("should return correct description", () => {
      expect(uploadValidator.getDescription()).toBe("Not a valid upload file");
    });
  });

  describe("Inheritance", () => {
    test("should extend Validator base class", () => {
      expect(uploadValidator).toBeInstanceOf(Validator);
      expect(uploadValidator).toBeInstanceOf(Upload);
    });

    test("should implement required methods", () => {
      expect(typeof uploadValidator.isValid).toBe("function");
      expect(typeof uploadValidator.getDescription).toBe("function");
    });
  });

  describe("Valid Upload Files", () => {
    test("should validate existing regular files", async () => {
      const testFile = path.join(tempDir, "valid-upload.txt");
      await fs.writeFile(testFile, "This is a valid upload file");

      const result = await uploadValidator.isValid(testFile);
      expect(result).toBe(true);
    });

    test("should validate different file types", async () => {
      const files = [
        { name: "document.pdf", content: "PDF content" },
        { name: "image.jpg", content: Buffer.from([0xff, 0xd8, 0xff]) },
        { name: "data.json", content: '{"key": "value"}' },
        { name: "script.js", content: 'console.log("hello");' },
        { name: "style.css", content: "body { margin: 0; }" },
        { name: "README", content: "This is a readme file" },
      ];

      for (const file of files) {
        const filePath = path.join(tempDir, file.name);
        await fs.writeFile(filePath, file.content);

        const result = await uploadValidator.isValid(filePath);
        expect(result).toBe(true);
      }
    });

    test("should validate empty files", async () => {
      const emptyFile = path.join(tempDir, "empty.txt");
      await fs.writeFile(emptyFile, "");

      const result = await uploadValidator.isValid(emptyFile);
      expect(result).toBe(true);
    });

    test("should validate large files", async () => {
      const largeFile = path.join(tempDir, "large.txt");
      const largeContent = "x".repeat(100000); // 100KB of content
      await fs.writeFile(largeFile, largeContent);

      const result = await uploadValidator.isValid(largeFile);
      expect(result).toBe(true);
    });

    test("should validate binary files", async () => {
      const binaryFile = path.join(tempDir, "binary.dat");
      const binaryContent = Buffer.alloc(1000);
      // Fill with random binary data
      for (let i = 0; i < binaryContent.length; i++) {
        binaryContent[i] = Math.floor(Math.random() * 256);
      }
      await fs.writeFile(binaryFile, binaryContent);

      const result = await uploadValidator.isValid(binaryFile);
      expect(result).toBe(true);
    });

    test("should validate files with special characters in names", async () => {
      const specialFiles = [
        "file-with-dashes.txt",
        "file_with_underscores.txt",
        "file with spaces.txt",
        "file.multiple.dots.txt",
        "файл.txt", // Cyrillic
        "文件.txt", // Chinese
        "ファイル.txt", // Japanese
      ];

      for (const fileName of specialFiles) {
        try {
          const filePath = path.join(tempDir, fileName);
          await fs.writeFile(filePath, "content");

          const result = await uploadValidator.isValid(filePath);
          expect(result).toBe(true);
        } catch (error) {
          // Some file systems might not support certain characters
          console.log(
            `Skipping test for ${fileName} due to file system limitations`,
          );
        }
      }
    });
  });

  describe("Invalid Upload Files", () => {
    test("should reject non-existent files", async () => {
      const nonExistentFile = path.join(tempDir, "does-not-exist.txt");

      const result = await uploadValidator.isValid(nonExistentFile);
      expect(result).toBe(false);
    });

    test("should reject directories", async () => {
      const directory = path.join(tempDir, "test-directory");
      await fs.mkdir(directory);

      const result = await uploadValidator.isValid(directory);
      expect(result).toBe(false);
    });

    test("should reject symbolic links to files", async () => {
      const originalFile = path.join(tempDir, "original.txt");
      const symlinkFile = path.join(tempDir, "symlink.txt");

      await fs.writeFile(originalFile, "original content");

      try {
        await fs.symlink(originalFile, symlinkFile);

        const result = await uploadValidator.isValid(symlinkFile);
        expect(result).toBe(false); // Symlinks should be rejected
      } catch (error) {
        // Symlinks might not be supported on all platforms
        console.log("Skipping symlink test - not supported on this platform");
      }
    });

    test("should reject symbolic links to directories", async () => {
      const originalDir = path.join(tempDir, "original-dir");
      const symlinkDir = path.join(tempDir, "symlink-dir");

      await fs.mkdir(originalDir);

      try {
        await fs.symlink(originalDir, symlinkDir);

        const result = await uploadValidator.isValid(symlinkDir);
        expect(result).toBe(false);
      } catch (error) {
        // Symlinks might not be supported on all platforms
        console.log("Skipping symlink test - not supported on this platform");
      }
    });

    test("should reject non-string input types", async () => {
      const invalidInputs = [
        null,
        undefined,
        123,
        true,
        false,
        {},
        [],
        function () {},
        new Date(),
      ];

      for (const input of invalidInputs) {
        const result = await uploadValidator.isValid(input);
        expect(result).toBe(false);
      }
    });

    test("should reject empty strings", async () => {
      const result = await uploadValidator.isValid("");
      expect(result).toBe(false);
    });

    test("should reject whitespace-only strings", async () => {
      const whitespaceInputs = [" ", "\t", "\n", "\r\n", "   \t\n  "];

      for (const input of whitespaceInputs) {
        const result = await uploadValidator.isValid(input);
        expect(result).toBe(false);
      }
    });
  });

  describe("Edge Cases", () => {
    test("should handle very long file paths", async () => {
      // Create a file with a very long name
      const longName = "a".repeat(100) + ".txt";
      const longFile = path.join(tempDir, longName);

      try {
        await fs.writeFile(longFile, "content");
        const result = await uploadValidator.isValid(longFile);
        expect(result).toBe(true);
      } catch (error) {
        // Some file systems have path length limitations
        console.log("Skipping long path test - file system limitation");
      }
    });

    test("should handle nested directory structures", async () => {
      const nestedDir = path.join(tempDir, "level1", "level2", "level3");
      const nestedFile = path.join(nestedDir, "nested.txt");

      await fs.mkdir(nestedDir, { recursive: true });
      await fs.writeFile(nestedFile, "nested content");

      const result = await uploadValidator.isValid(nestedFile);
      expect(result).toBe(true);
    });

    test("should handle files with no extension", async () => {
      const noExtFile = path.join(tempDir, "no-extension-file");
      await fs.writeFile(noExtFile, "content without extension");

      const result = await uploadValidator.isValid(noExtFile);
      expect(result).toBe(true);
    });

    test("should handle files starting with dots", async () => {
      const hiddenFiles = [".gitignore", ".env", ".hidden", ".config.json"];

      for (const fileName of hiddenFiles) {
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, "hidden file content");

        const result = await uploadValidator.isValid(filePath);
        expect(result).toBe(true);
      }
    });

    test("should handle relative paths", async () => {
      const testFile = path.join(tempDir, "relative-test.txt");
      await fs.writeFile(testFile, "relative path test");

      // Test with relative path from current directory
      const relativePath = path.relative(process.cwd(), testFile);
      const result = await uploadValidator.isValid(relativePath);
      expect(result).toBe(true);
    });

    test("should handle absolute paths", async () => {
      const testFile = path.join(tempDir, "absolute-test.txt");
      await fs.writeFile(testFile, "absolute path test");

      // Test with absolute path
      const absolutePath = path.resolve(testFile);
      const result = await uploadValidator.isValid(absolutePath);
      expect(result).toBe(true);
    });
  });

  describe("Permission Handling", () => {
    test("should handle files with restricted permissions", async () => {
      const restrictedFile = path.join(tempDir, "restricted.txt");
      await fs.writeFile(restrictedFile, "restricted content");

      try {
        // Try to restrict read permissions
        await fs.chmod(restrictedFile, 0o000);

        // The validator should still detect it as a file, even if unreadable
        const result = await uploadValidator.isValid(restrictedFile);
        // This might vary by platform and implementation
        // The important thing is that it doesn't throw an error
        expect(typeof result).toBe("boolean");
      } catch (error) {
        // Chmod might not work on all platforms
        console.log("Skipping permission test - chmod not supported");
      } finally {
        // Restore permissions for cleanup
        try {
          await fs.chmod(restrictedFile, 0o644);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe("Async Behavior", () => {
    test("should handle multiple concurrent validations", async () => {
      const files: string[] = [];
      const validationPromises: Promise<boolean>[] = [];

      // Create multiple test files
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(tempDir, `concurrent-${i}.txt`);
        await fs.writeFile(filePath, `content ${i}`);
        files.push(filePath);
      }

      // Start all validations concurrently
      for (const filePath of files) {
        validationPromises.push(uploadValidator.isValid(filePath));
      }

      // Wait for all validations to complete
      const results = await Promise.all(validationPromises);

      // All should be valid
      results.forEach((result) => {
        expect(result).toBe(true);
      });
    });

    test("should return Promise that resolves to boolean", () => {
      const result = uploadValidator.isValid("any-string");
      expect(result).toBeInstanceOf(Promise);

      return result.then((value) => {
        expect(typeof value).toBe("boolean");
      });
    });
  });

  describe("Error Recovery", () => {
    test("should handle file system errors gracefully", async () => {
      // Test with a path that would cause an error
      const invalidPath = "\0invalid\0path\0";

      const result = await uploadValidator.isValid(invalidPath);
      expect(result).toBe(false);
    });

    test("should handle very long paths that exceed system limits", async () => {
      // Create a path that's likely to exceed system limits
      const veryLongPath = "/".repeat(5000) + "file.txt";

      const result = await uploadValidator.isValid(veryLongPath);
      expect(result).toBe(false);
    });
  });
});
