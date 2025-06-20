import { FileSize } from "../../src/validator/file-size";
import { Validator } from "../../src/validator/validator";

describe("FileSize Validator", () => {
  describe("Constructor", () => {
    test("should create validator with max size", () => {
      const maxSize = 1024 * 1024; // 1MB
      const validator = new FileSize(maxSize);
      expect(validator).toBeInstanceOf(FileSize);
      expect(validator).toBeInstanceOf(Validator);
    });

    test("should accept zero as max size", () => {
      const validator = new FileSize(0);
      expect(validator).toBeInstanceOf(FileSize);
    });

    test("should accept large max sizes", () => {
      const maxSize = 1024 * 1024 * 1024 * 10; // 10GB
      const validator = new FileSize(maxSize);
      expect(validator).toBeInstanceOf(FileSize);
    });
  });

  describe("Basic Properties", () => {
    let validator: FileSize;
    const maxSize = 1024 * 1024; // 1MB

    beforeEach(() => {
      validator = new FileSize(maxSize);
    });

    test("should return correct description", () => {
      expect(validator.getDescription()).toBe(
        `File size can't be bigger than ${maxSize}`,
      );
    });
  });

  describe("Validation Logic", () => {
    describe("Small File Sizes", () => {
      let validator: FileSize;
      const maxSize = 1024; // 1KB

      beforeEach(() => {
        validator = new FileSize(maxSize);
      });

      test("should validate files smaller than max size", () => {
        expect(validator.isValid(0)).toBe(true);
        expect(validator.isValid(512)).toBe(true);
        expect(validator.isValid(1023)).toBe(true);
        expect(validator.isValid(1024)).toBe(true); // Equal to max size
      });

      test("should reject files larger than max size", () => {
        expect(validator.isValid(1025)).toBe(false);
        expect(validator.isValid(2048)).toBe(false);
        expect(validator.isValid(10240)).toBe(false);
      });
    });

    describe("Medium File Sizes", () => {
      let validator: FileSize;
      const maxSize = 1024 * 1024; // 1MB

      beforeEach(() => {
        validator = new FileSize(maxSize);
      });

      test("should validate common file sizes", () => {
        expect(validator.isValid(1024)).toBe(true); // 1KB
        expect(validator.isValid(1024 * 100)).toBe(true); // 100KB
        expect(validator.isValid(1024 * 512)).toBe(true); // 512KB
        expect(validator.isValid(1024 * 1024)).toBe(true); // 1MB (equal to max)
      });

      test("should reject larger file sizes", () => {
        expect(validator.isValid(1024 * 1024 + 1)).toBe(false); // 1MB + 1 byte
        expect(validator.isValid(1024 * 1024 * 2)).toBe(false); // 2MB
        expect(validator.isValid(1024 * 1024 * 10)).toBe(false); // 10MB
      });
    });

    describe("Large File Sizes", () => {
      let validator: FileSize;
      const maxSize = 1024 * 1024 * 1024; // 1GB

      beforeEach(() => {
        validator = new FileSize(maxSize);
      });

      test("should validate large file sizes", () => {
        expect(validator.isValid(1024 * 1024 * 100)).toBe(true); // 100MB
        expect(validator.isValid(1024 * 1024 * 500)).toBe(true); // 500MB
        expect(validator.isValid(1024 * 1024 * 1024)).toBe(true); // 1GB (equal to max)
      });

      test("should reject very large file sizes", () => {
        expect(validator.isValid(1024 * 1024 * 1024 + 1)).toBe(false); // 1GB + 1 byte
        expect(validator.isValid(1024 * 1024 * 1024 * 2)).toBe(false); // 2GB
      });
    });

    describe("Zero Max Size", () => {
      let validator: FileSize;

      beforeEach(() => {
        validator = new FileSize(0);
      });

      test("should only allow zero size files", () => {
        expect(validator.isValid(0)).toBe(true);
      });

      test("should reject any non-zero size", () => {
        expect(validator.isValid(1)).toBe(false);
        expect(validator.isValid(100)).toBe(false);
        expect(validator.isValid(1024)).toBe(false);
      });
    });
  });

  describe("Input Type Validation", () => {
    let validator: FileSize;

    beforeEach(() => {
      validator = new FileSize(1024);
    });

    test("should accept valid integer inputs", () => {
      expect(validator.isValid(0)).toBe(true);
      expect(validator.isValid(1)).toBe(true);
      expect(validator.isValid(100)).toBe(true);
      expect(validator.isValid(1024)).toBe(true);
    });

    test("should reject non-number inputs", () => {
      expect(validator.isValid("100")).toBe(false);
      expect(validator.isValid("1024")).toBe(false);
      expect(validator.isValid(null)).toBe(false);
      expect(validator.isValid(undefined)).toBe(false);
      expect(validator.isValid(true)).toBe(false);
      expect(validator.isValid(false)).toBe(false);
      expect(validator.isValid({})).toBe(false);
      expect(validator.isValid([])).toBe(false);
    });

    test("should reject floating point numbers", () => {
      expect(validator.isValid(100.5)).toBe(false);
      expect(validator.isValid(1024.1)).toBe(false);
      expect(validator.isValid(0.5)).toBe(false);
      expect(validator.isValid(Math.PI)).toBe(false);
    });

    test("should reject negative numbers", () => {
      expect(validator.isValid(-1)).toBe(false);
      expect(validator.isValid(-100)).toBe(false);
      expect(validator.isValid(-1024)).toBe(false);
    });

    test("should reject Infinity and NaN", () => {
      expect(validator.isValid(Infinity)).toBe(false);
      expect(validator.isValid(-Infinity)).toBe(false);
      expect(validator.isValid(NaN)).toBe(false);
    });

    test("should reject very large numbers that exceed MAX_SAFE_INTEGER", () => {
      expect(validator.isValid(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
      expect(validator.isValid(Number.MAX_VALUE)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("should handle maximum safe integer as max size", () => {
      const validator = new FileSize(Number.MAX_SAFE_INTEGER);
      expect(validator.isValid(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(validator.isValid(Number.MAX_SAFE_INTEGER - 1)).toBe(true);
    });

    test("should handle very small file sizes", () => {
      const validator = new FileSize(1);
      expect(validator.isValid(0)).toBe(true);
      expect(validator.isValid(1)).toBe(true);
      expect(validator.isValid(2)).toBe(false);
    });

    test("should handle boundary values correctly", () => {
      const maxSize = 1000;
      const validator = new FileSize(maxSize);

      expect(validator.isValid(maxSize - 1)).toBe(true);
      expect(validator.isValid(maxSize)).toBe(true);
      expect(validator.isValid(maxSize + 1)).toBe(false);
    });
  });

  describe("Real World File Sizes", () => {
    describe("Image File Validator", () => {
      let imageValidator: FileSize;

      beforeEach(() => {
        // 5MB limit for images
        imageValidator = new FileSize(5 * 1024 * 1024);
      });

      test("should validate typical image sizes", () => {
        expect(imageValidator.isValid(50 * 1024)).toBe(true); // 50KB thumbnail
        expect(imageValidator.isValid(500 * 1024)).toBe(true); // 500KB photo
        expect(imageValidator.isValid(2 * 1024 * 1024)).toBe(true); // 2MB high-res
        expect(imageValidator.isValid(5 * 1024 * 1024)).toBe(true); // 5MB max
      });

      test("should reject oversized images", () => {
        expect(imageValidator.isValid(6 * 1024 * 1024)).toBe(false); // 6MB
        expect(imageValidator.isValid(10 * 1024 * 1024)).toBe(false); // 10MB
      });
    });

    describe("Document File Validator", () => {
      let docValidator: FileSize;

      beforeEach(() => {
        // 10MB limit for documents
        docValidator = new FileSize(10 * 1024 * 1024);
      });

      test("should validate typical document sizes", () => {
        expect(docValidator.isValid(10 * 1024)).toBe(true); // 10KB text
        expect(docValidator.isValid(100 * 1024)).toBe(true); // 100KB doc
        expect(docValidator.isValid(1 * 1024 * 1024)).toBe(true); // 1MB PDF
        expect(docValidator.isValid(5 * 1024 * 1024)).toBe(true); // 5MB presentation
      });
    });

    describe("Video File Validator", () => {
      let videoValidator: FileSize;

      beforeEach(() => {
        // 100MB limit for videos
        videoValidator = new FileSize(100 * 1024 * 1024);
      });

      test("should validate typical video sizes", () => {
        expect(videoValidator.isValid(10 * 1024 * 1024)).toBe(true); // 10MB short clip
        expect(videoValidator.isValid(50 * 1024 * 1024)).toBe(true); // 50MB video
        expect(videoValidator.isValid(100 * 1024 * 1024)).toBe(true); // 100MB max
      });

      test("should reject oversized videos", () => {
        expect(videoValidator.isValid(150 * 1024 * 1024)).toBe(false); // 150MB
        expect(videoValidator.isValid(1024 * 1024 * 1024)).toBe(false); // 1GB
      });
    });
  });

  describe("Description Message", () => {
    test("should include max size in description", () => {
      const sizes = [1024, 1048576, 5242880];

      sizes.forEach((size) => {
        const validator = new FileSize(size);
        expect(validator.getDescription()).toContain(size.toString());
      });
    });

    test("should format description correctly", () => {
      const validator = new FileSize(1024);
      expect(validator.getDescription()).toBe(
        "File size can't be bigger than 1024",
      );
    });
  });
});
