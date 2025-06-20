import { S3 } from "../../src/device/s3";
import { Storage } from "../../src/storage";

describe("S3 Device", () => {
  let s3Device: S3;
  const testCredentials = {
    root: "test-storage",
    accessKey: process.env.AWS_ACCESS_KEY || "test-access-key",
    secretKey: process.env.AWS_SECRET_KEY || "test-secret-key",
    bucket: process.env.AWS_BUCKET || "test-bucket",
    region: S3.US_EAST_1,
    acl: S3.ACL_PRIVATE,
  };

  beforeEach(() => {
    s3Device = new S3(
      testCredentials.root,
      testCredentials.accessKey,
      testCredentials.secretKey,
      testCredentials.bucket,
      testCredentials.region,
      testCredentials.acl,
    );
  });

  describe("Basic Properties", () => {
    test("should return correct name", () => {
      expect(s3Device.getName()).toBe("S3 Storage");
    });

    test("should return correct type", () => {
      expect(s3Device.getType()).toBe(Storage.DEVICE_S3);
    });

    test("should return correct description", () => {
      expect(s3Device.getDescription()).toBe(
        "S3 Bucket Storage drive for AWS or on premise solution",
      );
    });

    test("should return correct root", () => {
      expect(s3Device.getRoot()).toBe(testCredentials.root);
    });

    test("should generate correct path", () => {
      const filename = "test.txt";
      const expectedPath = `${testCredentials.root}/${filename}`;
      expect(s3Device.getPath(filename)).toBe(expectedPath);
    });
  });

  describe("HTTP Method Constants", () => {
    test("should have correct HTTP method constants", () => {
      expect(S3.METHOD_GET).toBe("GET");
      expect(S3.METHOD_POST).toBe("POST");
      expect(S3.METHOD_PUT).toBe("PUT");
      expect(S3.METHOD_PATCH).toBe("PATCH");
      expect(S3.METHOD_DELETE).toBe("DELETE");
      expect(S3.METHOD_HEAD).toBe("HEAD");
      expect(S3.METHOD_OPTIONS).toBe("OPTIONS");
      expect(S3.METHOD_CONNECT).toBe("CONNECT");
      expect(S3.METHOD_TRACE).toBe("TRACE");
    });
  });

  describe("AWS Region Constants", () => {
    test("should have correct AWS region constants", () => {
      expect(S3.US_EAST_1).toBe("us-east-1");
      expect(S3.US_EAST_2).toBe("us-east-2");
      expect(S3.US_WEST_1).toBe("us-west-1");
      expect(S3.US_WEST_2).toBe("us-west-2");
      expect(S3.EU_WEST_1).toBe("eu-west-1");
      expect(S3.EU_CENTRAL_1).toBe("eu-central-1");
      expect(S3.AP_SOUTHEAST_1).toBe("ap-southeast-1");
      expect(S3.AP_NORTHEAST_1).toBe("ap-northeast-1");
    });

    test("should have China region constants", () => {
      expect(S3.CN_NORTH_1).toBe("cn-north-1");
      expect(S3.CN_NORTH_4).toBe("cn-north-4");
      expect(S3.CN_NORTHWEST_1).toBe("cn-northwest-1");
    });

    test("should have GovCloud region constants", () => {
      expect(S3.US_GOV_EAST_1).toBe("us-gov-east-1");
      expect(S3.US_GOV_WEST_1).toBe("us-gov-west-1");
    });
  });

  describe("ACL Constants", () => {
    test("should have correct ACL constants", () => {
      expect(S3.ACL_PRIVATE).toBe("private");
      expect(S3.ACL_PUBLIC_READ).toBe("public-read");
      expect(S3.ACL_PUBLIC_READ_WRITE).toBe("public-read-write");
      expect(S3.ACL_AUTHENTICATED_READ).toBe("authenticated-read");
    });
  });

  describe("Constructor and Host Configuration", () => {
    test("should set correct host for standard AWS regions", () => {
      const device = new S3(
        testCredentials.root,
        testCredentials.accessKey,
        testCredentials.secretKey,
        testCredentials.bucket,
        S3.US_EAST_1,
      );

      const expectedHost = `${testCredentials.bucket}.s3.${S3.US_EAST_1}.amazonaws.com`;
      expect((device as any).headers.host).toBe(expectedHost);
    });

    test("should set correct host for China regions", () => {
      const device = new S3(
        testCredentials.root,
        testCredentials.accessKey,
        testCredentials.secretKey,
        testCredentials.bucket,
        S3.CN_NORTH_1,
      );

      const expectedHost = `${testCredentials.bucket}.s3.${S3.CN_NORTH_1}.amazonaws.cn`;
      expect((device as any).headers.host).toBe(expectedHost);
    });

    test("should set correct host for custom endpoint", () => {
      const customEndpoint = "custom.s3.endpoint.com";
      const device = new S3(
        testCredentials.root,
        testCredentials.accessKey,
        testCredentials.secretKey,
        testCredentials.bucket,
        S3.US_EAST_1,
        S3.ACL_PRIVATE,
        customEndpoint,
      );

      const expectedHost = `${testCredentials.bucket}.${customEndpoint}`;
      expect((device as any).headers.host).toBe(expectedHost);
    });
  });

  describe("Transfer Chunk Size", () => {
    test("should have default transfer chunk size", () => {
      expect(s3Device.getTransferChunkSize()).toBe(20000000); // 20 MB
    });

    test("should allow setting transfer chunk size", () => {
      const newSize = 10000000; // 10 MB
      s3Device.setTransferChunkSize(newSize);
      expect(s3Device.getTransferChunkSize()).toBe(newSize);
    });
  });

  describe("Retry Configuration", () => {
    test("should allow setting retry attempts", () => {
      const originalAttempts = (S3 as any).retryAttempts;

      S3.setRetryAttempts(5);
      expect((S3 as any).retryAttempts).toBe(5);

      // Reset to original value
      S3.setRetryAttempts(originalAttempts);
    });

    test("should allow setting retry delay", () => {
      const originalDelay = (S3 as any).retryDelay;

      S3.setRetryDelay(1000);
      expect((S3 as any).retryDelay).toBe(1000);

      // Reset to original value
      S3.setRetryDelay(originalDelay);
    });
  });

  describe("Path and URL Utilities", () => {
    test("should handle absolute paths correctly", () => {
      expect(s3Device.getAbsolutePath("/path/to/../file.txt")).toBe(
        "/path/file.txt",
      );
      expect(s3Device.getAbsolutePath("/path/./file.txt")).toBe(
        "/path/file.txt",
      );
      expect(s3Device.getAbsolutePath("//double//slash")).toBe("/double/slash");
    });
  });

  describe("Crypto Utilities", () => {
    test("should generate MD5 hash", () => {
      const testData = "Hello, World!";
      const hash = (s3Device as any).md5(testData);
      expect(hash).toBeInstanceOf(Buffer);
      expect(hash.length).toBe(16); // MD5 produces 16-byte hash
    });

    test("should generate SHA256 hash", () => {
      const testData = "Hello, World!";
      const hash = (s3Device as any).sha256(testData);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(64); // SHA256 produces 64-character hex string
    });

    test("should generate HMAC-SHA256", () => {
      const testData = "Hello, World!";
      const key = "secret-key";
      const hmac = (s3Device as any).hmacSha256(testData, key, "hex");
      expect(typeof hmac).toBe("string");
      expect(hmac.length).toBe(64); // HMAC-SHA256 produces 64-character hex string
    });
  });

  describe("Signature Generation", () => {
    test("should generate AWS Signature V4", () => {
      const method = "GET";
      const uri = "/test-file.txt";
      const parameters = {};

      // Set required AMZ headers for signature generation
      (s3Device as any).amzHeaders["x-amz-date"] = "20230101T000000Z";
      (s3Device as any).amzHeaders["x-amz-content-sha256"] =
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      const signature = (s3Device as any).getSignatureV4(
        method,
        uri,
        parameters,
      );
      expect(signature).toContain("AWS4-HMAC-SHA256");
      expect(signature).toContain("Credential=");
      expect(signature).toContain("SignedHeaders=");
      expect(signature).toContain("Signature=");
    });
  });

  describe("Upload Operations", () => {
    test("should handle single chunk upload with string source", async () => {
      // Mock fs.readFile to avoid file system operations
      const originalImport = (global as any).import;
      (global as any).import = jest.fn().mockImplementation((module) => {
        if (module === "fs") {
          return Promise.resolve({
            promises: {
              readFile: jest
                .fn()
                .mockResolvedValue(Buffer.from("test content")),
            },
          });
        }
        return originalImport(module);
      });

      // Mock the write method to avoid actual S3 calls
      const writeSpy = jest.spyOn(s3Device, "write").mockResolvedValue(true);

      const result = await s3Device.upload("test-file.txt", "destination.txt");
      expect(result).toBe(1);
      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      (global as any).import = originalImport;
    });

    test("should handle multipart upload initialization", async () => {
      const testPath = "test-multipart.txt";
      const testContent = "Test content for multipart upload";
      const testContentType = "text/plain";

      // Mock the call method to simulate AWS responses
      const callSpy = jest.spyOn(s3Device as any, "call").mockResolvedValue({
        body: { UploadId: "test-upload-id-123" },
      });

      const uploadId = await (s3Device as any).createMultipartUpload(
        testPath,
        testContentType,
      );
      expect(uploadId).toBe("test-upload-id-123");
      expect(callSpy).toHaveBeenCalledWith(
        S3.METHOD_POST,
        `/${encodeURIComponent(testPath).replace(/%2F/g, "/").replace(/%3F/g, "?")}`,
        "",
        { uploads: "" },
      );

      callSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid credentials gracefully", async () => {
      const invalidDevice = new S3(
        "test",
        "invalid-key",
        "invalid-secret",
        "invalid-bucket",
        S3.US_EAST_1,
      );

      // Mock fetch to simulate authentication error
      const originalFetch = global.fetch;
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Authentication failed"));

      await expect(invalidDevice.exists("test-file.txt")).rejects.toThrow();

      global.fetch = originalFetch;
    });

    test("should handle network errors", async () => {
      // Mock fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      await expect(s3Device.read("test-file.txt")).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe("Directory Operations", () => {
    test("should handle createDirectory (S3 has no real directories)", async () => {
      const result = await s3Device.createDirectory("/test/path");
      expect(result).toBe(true); // S3 always returns true as it doesn't have real directories
    });

    test("should handle getDirectorySize", async () => {
      const size = await s3Device.getDirectorySize("/test/path");
      expect(size).toBe(-1); // S3 returns -1 for directory size
    });

    test("should handle getPartitionFreeSpace", async () => {
      const freeSpace = await s3Device.getPartitionFreeSpace();
      expect(freeSpace).toBe(-1); // S3 returns -1 for partition free space
    });

    test("should throw error for getPartitionTotalSpace", async () => {
      await expect(s3Device.getPartitionTotalSpace()).rejects.toThrow(
        "Method not implemented.",
      );
    });
  });

  describe("File Listing", () => {
    test("should process list objects response correctly", async () => {
      const mockListResponse = {
        IsTruncated: "false",
        KeyCount: "2",
        MaxKeys: "1000",
        Contents: [{ Key: "file1.txt" }, { Key: "file2.txt" }],
      };

      // Mock the listObjects method
      const listObjectsSpy = jest
        .spyOn(s3Device as any, "listObjects")
        .mockResolvedValue(mockListResponse);

      const result = await s3Device.getFiles("test-dir/");
      expect(result.IsTruncated).toBe(false);
      expect(result.KeyCount).toBe(2);
      expect(result.MaxKeys).toBe(1000);

      listObjectsSpy.mockRestore();
    });
  });

  describe("MIME Type Detection", () => {
    test("should detect common MIME types", async () => {
      expect(await (s3Device as any).getMimeType("test.txt")).toBe(
        "text/plain",
      );
      expect(await (s3Device as any).getMimeType("test.html")).toBe(
        "text/html",
      );
      expect(await (s3Device as any).getMimeType("test.json")).toBe(
        "application/json",
      );
      expect(await (s3Device as any).getMimeType("test.png")).toBe("image/png");
      expect(await (s3Device as any).getMimeType("test.jpg")).toBe(
        "image/jpeg",
      );
      expect(await (s3Device as any).getMimeType("test.pdf")).toBe(
        "application/pdf",
      );
    });

    test("should return default MIME type for unknown extensions", async () => {
      expect(await (s3Device as any).getMimeType("test.unknown")).toBe(
        "application/octet-stream",
      );
      expect(await (s3Device as any).getMimeType("test")).toBe(
        "application/octet-stream",
      );
    });
  });
});
