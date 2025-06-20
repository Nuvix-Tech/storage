import { Storage } from "../storage";
import { S3 } from "./s3";

export class MinIO extends S3 {
  /**
   * MinIO Constructor
   */
  constructor(
    root: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
    endpoint: string = "localhost:9000",
    acl: string = S3.ACL_PRIVATE,
    useSSL: boolean = false,
  ) {
    const protocol = useSSL ? "https" : "http";
    // Remove protocol from endpoint if it exists
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, "");

    super(root, accessKey, secretKey, bucket, "us-east-1", acl, cleanEndpoint);

    // Override the host for MinIO
    this.headers["host"] = `${bucket}.${cleanEndpoint}`;

    // Store the full endpoint URL for MinIO-specific operations
    this.endpointUrl = `${protocol}://${cleanEndpoint}`;
  }

  private endpointUrl: string;

  getName(): string {
    return "MinIO Storage";
  }

  getDescription(): string {
    return "MinIO S3-compatible object storage server";
  }

  getType(): string {
    return Storage.DEVICE_MINIO;
  }

  /**
   * Override the call method to use the custom endpoint
   */
  protected async call(
    method: string,
    uri: string,
    data: string | Buffer = "",
    parameters: Record<string, string> = {},
    decode: boolean = true,
  ): Promise<any> {
    // Temporarily modify the host header to not include the bucket for MinIO
    const originalHost = this.headers["host"];

    // For MinIO, we need to handle path-style URLs differently
    const bucketName = originalHost.split(".")[0];
    const endpoint = originalHost.split(".").slice(1).join(".");

    // Use path-style URLs for MinIO
    this.headers["host"] = endpoint;

    const queryString = Object.keys(parameters).length
      ? "?" +
        Object.entries(parameters)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&")
      : "";
    const pathStyleUri = `/${bucketName}${this.getAbsolutePath(uri)}`;
    const url = `${this.endpointUrl}${pathStyleUri}${queryString}`;

    this.amzHeaders["x-amz-date"] = new Date()
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "");

    if (!this.amzHeaders["x-amz-content-sha256"]) {
      this.amzHeaders["x-amz-content-sha256"] = this.sha256(data);
    }

    const headers: Record<string, string> = {};

    for (const [header, value] of Object.entries(this.amzHeaders)) {
      if (value.length > 0) {
        headers[header] = value;
      }
    }

    this.headers["date"] = new Date().toUTCString();

    for (const [header, value] of Object.entries(this.headers)) {
      if (value.length > 0) {
        headers[header] = value;
      }
    }

    headers["Authorization"] = this.getSignatureV4(
      method,
      pathStyleUri,
      parameters,
    );

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === S3.METHOD_PUT || method === S3.METHOD_POST) {
      fetchOptions.body = data;
    }

    const response = await fetch(url, fetchOptions);

    // Restore original host
    this.headers["host"] = originalHost;

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    let body = await response.text();

    if (
      decode &&
      (responseHeaders["content-type"] === "application/xml" ||
        (body.startsWith("<?xml") &&
          responseHeaders["content-type"] !== "image/svg+xml"))
    ) {
      const xml2js = await import("xml2js");
      const parser = new xml2js.Parser();
      body = await parser.parseStringPromise(body);
    }

    return {
      body,
      headers: responseHeaders,
      code: response.status,
    };
  }
}
