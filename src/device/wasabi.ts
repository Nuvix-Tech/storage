import { Storage } from "../storage";
import { S3 } from "./s3";

export class Wasabi extends S3 {
  /**
   * Regions constants
   */
  static readonly US_WEST_1 = "us-west-1";
  static readonly AP_NORTHEAST_1 = "ap-northeast-1";
  static readonly AP_NORTHEAST_2 = "ap-northeast-2";
  static readonly EU_CENTRAL_1 = "eu-central-1";
  static readonly EU_CENTRAL_2 = "eu-central-2";
  static readonly EU_WEST_1 = "eu-west-1";
  static readonly EU_WEST_2 = "eu-west-2";
  static readonly US_CENTRAL_1 = "us-central-1";
  static readonly US_EAST_1 = "us-east-1";
  static readonly US_EAST_2 = "us-east-2";

  /**
   * Wasabi Constructor
   */
  constructor(
    root: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
    region: string = Wasabi.EU_CENTRAL_1,
    acl: string = S3.ACL_PRIVATE,
  ) {
    super(root, accessKey, secretKey, bucket, region, acl);
    this.headers["host"] = `${bucket}.s3.${region}.wasabisys.com`;
  }

  getName(): string {
    return "Wasabi Storage";
  }

  getDescription(): string {
    return "Wasabi Storage";
  }

  getType(): string {
    return Storage.DEVICE_WASABI;
  }
}
