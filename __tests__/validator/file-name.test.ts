import { FileName } from "../../src/validator/file-name";
import { Validator } from "../../src/validator/validator";

describe("FileName Validator", () => {
  let fileNameValidator: FileName;

  beforeEach(() => {
    fileNameValidator = new FileName();
  });

  describe("Basic Properties", () => {
    test("should return correct description", () => {
      expect(fileNameValidator.getDescription()).toBe("Filename is not valid");
    });
  });

  describe("Inheritance", () => {
    test("should extend Validator base class", () => {
      expect(fileNameValidator).toBeInstanceOf(Validator);
      expect(fileNameValidator).toBeInstanceOf(FileName);
    });
  });

  describe("Valid Filenames", () => {
    test("should validate simple alphanumeric filenames", () => {
      expect(fileNameValidator.isValid("file123")).toBe(true);
      expect(fileNameValidator.isValid("test")).toBe(true);
      expect(fileNameValidator.isValid("myfile")).toBe(true);
      expect(fileNameValidator.isValid("data2023")).toBe(true);
    });

    test("should validate filenames with dots", () => {
      expect(fileNameValidator.isValid("file.txt")).toBe(true);
      expect(fileNameValidator.isValid("image.jpg")).toBe(true);
      expect(fileNameValidator.isValid("document.pdf")).toBe(true);
      expect(fileNameValidator.isValid("script.js")).toBe(true);
    });

    test("should validate filenames with multiple dots", () => {
      expect(fileNameValidator.isValid("file.backup.txt")).toBe(true);
      expect(fileNameValidator.isValid("script.min.js")).toBe(true);
      expect(fileNameValidator.isValid("archive.tar.gz")).toBe(true);
      expect(fileNameValidator.isValid("config.local.json")).toBe(true);
    });

    test("should validate filenames starting with dots", () => {
      expect(fileNameValidator.isValid(".gitignore")).toBe(true);
      expect(fileNameValidator.isValid(".env")).toBe(true);
      expect(fileNameValidator.isValid(".htaccess")).toBe(true);
      expect(fileNameValidator.isValid(".hidden.txt")).toBe(true);
    });

    test("should validate filenames ending with dots", () => {
      expect(fileNameValidator.isValid("file.")).toBe(true);
      expect(fileNameValidator.isValid("test..")).toBe(true);
      expect(fileNameValidator.isValid("name...")).toBe(true);
    });

    test("should validate numeric filenames", () => {
      expect(fileNameValidator.isValid("123")).toBe(true);
      expect(fileNameValidator.isValid("456.txt")).toBe(true);
      expect(fileNameValidator.isValid("2023.01.01")).toBe(true);
    });

    test("should validate mixed case filenames", () => {
      expect(fileNameValidator.isValid("MyFile")).toBe(true);
      expect(fileNameValidator.isValid("TestData")).toBe(true);
      expect(fileNameValidator.isValid("README")).toBe(true);
      expect(fileNameValidator.isValid("CamelCase.txt")).toBe(true);
    });

    test("should validate single character filenames", () => {
      expect(fileNameValidator.isValid("a")).toBe(true);
      expect(fileNameValidator.isValid("1")).toBe(true);
      expect(fileNameValidator.isValid(".")).toBe(true);
      expect(fileNameValidator.isValid("z")).toBe(true);
    });
  });

  describe("Invalid Filenames", () => {
    test("should reject empty or null filenames", () => {
      expect(fileNameValidator.isValid("")).toBe(false);
      expect(fileNameValidator.isValid(null)).toBe(false);
      expect(fileNameValidator.isValid(undefined)).toBe(false);
    });

    test("should reject non-string types", () => {
      expect(fileNameValidator.isValid(123)).toBe(false);
      expect(fileNameValidator.isValid(true)).toBe(false);
      expect(fileNameValidator.isValid(false)).toBe(false);
      expect(fileNameValidator.isValid({})).toBe(false);
      expect(fileNameValidator.isValid([])).toBe(false);
    });

    test("should reject filenames with spaces", () => {
      expect(fileNameValidator.isValid("my file")).toBe(false);
      expect(fileNameValidator.isValid("test file.txt")).toBe(false);
      expect(fileNameValidator.isValid(" filename")).toBe(false);
      expect(fileNameValidator.isValid("filename ")).toBe(false);
      expect(fileNameValidator.isValid("file name.doc")).toBe(false);
    });

    test("should reject filenames with hyphens", () => {
      expect(fileNameValidator.isValid("my-file")).toBe(false);
      expect(fileNameValidator.isValid("test-data.txt")).toBe(false);
      expect(fileNameValidator.isValid("-filename")).toBe(false);
      expect(fileNameValidator.isValid("filename-")).toBe(false);
    });

    test("should reject filenames with underscores", () => {
      expect(fileNameValidator.isValid("my_file")).toBe(false);
      expect(fileNameValidator.isValid("test_data.txt")).toBe(false);
      expect(fileNameValidator.isValid("_filename")).toBe(false);
      expect(fileNameValidator.isValid("filename_")).toBe(false);
    });

    test("should reject filenames with special characters", () => {
      expect(fileNameValidator.isValid("file@name")).toBe(false);
      expect(fileNameValidator.isValid("file#name")).toBe(false);
      expect(fileNameValidator.isValid("file$name")).toBe(false);
      expect(fileNameValidator.isValid("file%name")).toBe(false);
      expect(fileNameValidator.isValid("file&name")).toBe(false);
      expect(fileNameValidator.isValid("file*name")).toBe(false);
      expect(fileNameValidator.isValid("file+name")).toBe(false);
      expect(fileNameValidator.isValid("file=name")).toBe(false);
    });

    test("should reject filenames with brackets and parentheses", () => {
      expect(fileNameValidator.isValid("file(name)")).toBe(false);
      expect(fileNameValidator.isValid("file[name]")).toBe(false);
      expect(fileNameValidator.isValid("file{name}")).toBe(false);
      expect(fileNameValidator.isValid("<filename>")).toBe(false);
    });

    test("should reject filenames with slashes", () => {
      expect(fileNameValidator.isValid("path/file")).toBe(false);
      expect(fileNameValidator.isValid("folder\\file")).toBe(false);
      expect(fileNameValidator.isValid("/filename")).toBe(false);
      expect(fileNameValidator.isValid("filename/")).toBe(false);
    });

    test("should reject filenames with quotes", () => {
      expect(fileNameValidator.isValid('file"name')).toBe(false);
      expect(fileNameValidator.isValid("file'name")).toBe(false);
      expect(fileNameValidator.isValid("`filename`")).toBe(false);
    });

    test("should reject filenames with unicode characters", () => {
      expect(fileNameValidator.isValid("файл")).toBe(false);
      expect(fileNameValidator.isValid("文件")).toBe(false);
      expect(fileNameValidator.isValid("ファイル")).toBe(false);
      expect(fileNameValidator.isValid("🔥file")).toBe(false);
    });

    test("should reject filenames with control characters", () => {
      expect(fileNameValidator.isValid("file\nname")).toBe(false);
      expect(fileNameValidator.isValid("file\tname")).toBe(false);
      expect(fileNameValidator.isValid("file\rname")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle very long filenames", () => {
      const longValidName = "a".repeat(1000);
      expect(fileNameValidator.isValid(longValidName)).toBe(true);

      const longInvalidName = "a".repeat(500) + "-" + "b".repeat(500);
      expect(fileNameValidator.isValid(longInvalidName)).toBe(false);
    });

    test("should handle repeated dots", () => {
      expect(fileNameValidator.isValid("..")).toBe(true);
      expect(fileNameValidator.isValid("...")).toBe(true);
      expect(fileNameValidator.isValid("....")).toBe(true);
    });

    test("should handle mixed valid and invalid characters", () => {
      expect(fileNameValidator.isValid("valid123.invalid-char")).toBe(false);
      expect(fileNameValidator.isValid("123valid.but_invalid")).toBe(false);
      expect(fileNameValidator.isValid("valid.123invalid@")).toBe(false);
    });

    test("should be strict about regex pattern", () => {
      // Test that the regex is anchored (^ and $)
      expect(fileNameValidator.isValid("valid123.txt-invalid")).toBe(false);
      expect(fileNameValidator.isValid("invalid-valid123.txt")).toBe(false);
    });
  });

  describe("Regex Pattern Validation", () => {
    test("should only allow a-z, A-Z, 0-9, and dots", () => {
      const validChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.";
      const validName = validChars;
      expect(fileNameValidator.isValid(validName)).toBe(true);

      // Test each valid character individually
      for (let char of validChars) {
        expect(fileNameValidator.isValid(char)).toBe(true);
      }

      // Test some invalid characters
      const invalidChars = '!@#$%^&*()_+-=[]{}|;:,<>?/~`" \t\n\r';
      for (let char of invalidChars) {
        expect(fileNameValidator.isValid(char)).toBe(false);
      }
    });
  });
});
