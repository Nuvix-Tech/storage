import { Device } from "../device";
import { Storage } from "../storage";
import crypto from 'crypto';

export class S3 extends Device {

    // HTTP Methods
    static readonly METHOD_GET = 'GET';
    static readonly METHOD_POST = 'POST';
    static readonly METHOD_PUT = 'PUT';
    static readonly METHOD_PATCH = 'PATCH';
    static readonly METHOD_DELETE = 'DELETE';
    static readonly METHOD_HEAD = 'HEAD';
    static readonly METHOD_OPTIONS = 'OPTIONS';
    static readonly METHOD_CONNECT = 'CONNECT';
    static readonly METHOD_TRACE = 'TRACE';

    // AWS Regions
    static readonly US_EAST_1 = 'us-east-1';
    static readonly US_EAST_2 = 'us-east-2';
    static readonly US_WEST_1 = 'us-west-1';
    static readonly US_WEST_2 = 'us-west-2';
    static readonly AF_SOUTH_1 = 'af-south-1';
    static readonly AP_EAST_1 = 'ap-east-1';
    static readonly AP_SOUTH_1 = 'ap-south-1';
    static readonly AP_NORTHEAST_3 = 'ap-northeast-3';
    static readonly AP_NORTHEAST_2 = 'ap-northeast-2';
    static readonly AP_NORTHEAST_1 = 'ap-northeast-1';
    static readonly AP_SOUTHEAST_1 = 'ap-southeast-1';
    static readonly AP_SOUTHEAST_2 = 'ap-southeast-2';
    static readonly CA_CENTRAL_1 = 'ca-central-1';
    static readonly EU_CENTRAL_1 = 'eu-central-1';
    static readonly EU_WEST_1 = 'eu-west-1';
    static readonly EU_SOUTH_1 = 'eu-south-1';
    static readonly EU_WEST_2 = 'eu-west-2';
    static readonly EU_WEST_3 = 'eu-west-3';
    static readonly EU_NORTH_1 = 'eu-north-1';
    static readonly SA_EAST_1 = 'eu-north-1';
    static readonly CN_NORTH_1 = 'cn-north-1';
    static readonly CN_NORTH_4 = 'cn-north-4';
    static readonly CN_NORTHWEST_1 = 'cn-northwest-1';
    static readonly ME_SOUTH_1 = 'me-south-1';
    static readonly US_GOV_EAST_1 = 'us-gov-east-1';
    static readonly US_GOV_WEST_1 = 'us-gov-west-1';

    // ACL Flags
    static readonly ACL_PRIVATE = 'private';
    static readonly ACL_PUBLIC_READ = 'public-read';
    static readonly ACL_PUBLIC_READ_WRITE = 'public-read-write';
    static readonly ACL_AUTHENTICATED_READ = 'authenticated-read';

    protected static readonly MAX_PAGE_SIZE = 1000;
    protected static retryAttempts = 3;
    protected static retryDelay = 500;

    protected accessKey: string;
    protected secretKey: string;
    protected bucket: string;
    protected region: string;
    protected acl: string = S3.ACL_PRIVATE;
    protected root: string = 'temp';
    protected headers: Record<string, string> = {
        'host': '',
        'date': '',
        'content-md5': '',
        'content-type': '',
    };
    protected amzHeaders: Record<string, string>;

    constructor(
        root: string,
        accessKey: string,
        secretKey: string,
        bucket: string,
        region: string = S3.US_EAST_1,
        acl: string = S3.ACL_PRIVATE,
        endpointUrl: string = ''
    ) {
        super();
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.bucket = bucket;
        this.region = region;
        this.root = root;
        this.acl = acl;
        this.amzHeaders = {};

        let host: string;
        if (endpointUrl) {
            host = `${bucket}.${endpointUrl}`;
        } else {
            switch (region) {
                case S3.CN_NORTH_1:
                case S3.CN_NORTH_4:
                case S3.CN_NORTHWEST_1:
                    host = `${bucket}.s3.${region}.amazonaws.cn`;
                    break;
                default:
                    host = `${bucket}.s3.${region}.amazonaws.com`;
            }
        }

        this.headers['host'] = host;
    }

    getName(): string {
        return 'S3 Storage';
    }

    getType(): string {
        return Storage.DEVICE_S3;
    }

    getDescription(): string {
        return 'S3 Bucket Storage drive for AWS or on premise solution';
    }

    getRoot(): string {
        return this.root;
    }

    getPath(filename: string, prefix?: string): string {
        return `${this.getRoot()}/${filename}`;
    }

    getPartitionTotalSpace(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    static setRetryAttempts(attempts: number): void {
        S3.retryAttempts = attempts;
    }

    static setRetryDelay(delay: number): void {
        S3.retryDelay = delay;
    }

    async upload(source: string | Buffer, path: string, chunk: number = 1, chunks: number = 1, metadata: Record<string, any> = {}): Promise<number> {
        let data: Buffer;
        let contentType: string;

        if (typeof source === 'string') {
            const fs = await import('fs');
            data = await fs.promises.readFile(source);
            contentType = await this.getMimeType(source);
        } else {
            data = source;
            contentType = metadata.contentType || 'application/octet-stream';
        }

        return this.uploadData(data, path, contentType, chunk, chunks, metadata);
    }

    async uploadData(data: Buffer, path: string, contentType: string, chunk: number = 1, chunks: number = 1, metadata: Record<string, any> = {}): Promise<number> {
        if (chunk === 1 && chunks === 1) {
            await this.write(path, data, contentType);
            return 1;
        }

        let uploadId = metadata['uploadId'];
        if (!uploadId) {
            uploadId = await this.createMultipartUpload(path, contentType);
            metadata['uploadId'] = uploadId;
        }

        metadata['parts'] = metadata['parts'] || {};
        metadata['chunks'] = metadata['chunks'] || 0;

        const etag = await this.uploadPart(data, path, contentType, chunk, uploadId);
        const cleanETag = etag.replace(/^"|"$/g, '');

        if (!(chunk in metadata['parts'])) {
            metadata['chunks']++;
        }

        metadata['parts'][chunk] = cleanETag;

        if (metadata['chunks'] === chunks) {
            await this.completeMultipartUpload(path, uploadId, metadata['parts']);
        }

        return metadata['chunks'];
    }

    async transfer(path: string, destination: string, device: Device): Promise<boolean> {
        try {
            const response = await this.getInfo(path);
            const size = parseInt(response['content-length'] || '0');
            const contentType = response['content-type'] || '';

            if (size <= this.transferChunkSize) {
                const source = await this.read(path);
                return device.write(destination, source, contentType);
            }

            const totalChunks = Math.ceil(size / this.transferChunkSize);
            const metadata = { content_type: contentType };

            for (let counter = 0; counter < totalChunks; counter++) {
                const start = counter * this.transferChunkSize;
                const data = await this.read(path, start, this.transferChunkSize);
                await device.uploadData(data, destination, contentType, counter + 1, totalChunks, metadata);
            }

            return true;
        } catch (e) {
            throw new Error('File not found');
        }
    }

    protected async createMultipartUpload(path: string, contentType: string): Promise<string> {
        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/').replace(/%3F/g, '?')}` : '/';

        this.headers['content-md5'] = Buffer.from(this.md5('')).toString('base64');
        delete this.amzHeaders['x-amz-content-sha256'];
        this.headers['content-type'] = contentType;
        this.amzHeaders['x-amz-acl'] = this.acl;

        const response = await this.call(S3.METHOD_POST, uri, '', { uploads: '' });
        return response.body['UploadId'];
    }

    protected async uploadPart(data: Buffer, path: string, contentType: string, chunk: number, uploadId: string): Promise<string> {
        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/').replace(/%3F/g, '?')}` : '/';

        this.headers['content-type'] = contentType;
        this.headers['content-md5'] = Buffer.from(this.md5(data)).toString('base64');
        this.amzHeaders['x-amz-content-sha256'] = this.sha256(data);
        delete this.amzHeaders['x-amz-acl'];

        const response = await this.call(S3.METHOD_PUT, uri, data, {
            partNumber: chunk.toString(),
            uploadId: uploadId,
        });

        return response.headers['etag'];
    }

    protected async completeMultipartUpload(path: string, uploadId: string, parts: Record<number, string>): Promise<boolean> {
        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/').replace(/%3F/g, '?')}` : '/';

        let body = '<CompleteMultipartUpload>';
        for (const [key, etag] of Object.entries(parts)) {
            body += `<Part><ETag>${etag}</ETag><PartNumber>${key}</PartNumber></Part>`;
        }
        body += '</CompleteMultipartUpload>';

        this.amzHeaders['x-amz-content-sha256'] = this.sha256(body);
        this.headers['content-md5'] = Buffer.from(this.md5(body)).toString('base64');
        await this.call(S3.METHOD_POST, uri, body, { uploadId });

        return true;
    }

    async abort(path: string, extra: string = ''): Promise<boolean> {
        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/')}` : '/';
        delete this.headers['content-type'];
        this.headers['content-md5'] = Buffer.from(this.md5('')).toString('base64');
        await this.call(S3.METHOD_DELETE, uri, '', { uploadId: extra });
        return true;
    }

    async read(path: string, offset: number = 0, length?: number): Promise<Buffer> {
        delete this.amzHeaders['x-amz-acl'];
        delete this.amzHeaders['x-amz-content-sha256'];
        delete this.headers['content-type'];
        this.headers['content-md5'] = Buffer.from(this.md5('')).toString('base64');

        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/')}` : '/';

        if (length !== undefined) {
            const end = offset + length - 1;
            this.headers['range'] = `bytes=${offset}-${end}`;
        } else {
            delete this.headers['range'];
        }

        const response = await this.call(S3.METHOD_GET, uri, '', {}, false);
        const arrayBuffer = await response.body.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async write(path: string, data: Buffer, contentType: string = ''): Promise<boolean> {
        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/').replace(/%3F/g, '?')}` : '/';

        this.headers['content-type'] = contentType;
        this.headers['content-md5'] = Buffer.from(this.md5(data)).toString('base64');
        this.amzHeaders['x-amz-content-sha256'] = this.sha256(data);
        this.amzHeaders['x-amz-acl'] = this.acl;

        await this.call(S3.METHOD_PUT, uri, data);
        return true;
    }

    async delete(path: string, recursive: boolean = false): Promise<boolean> {
        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/')}` : '/';

        delete this.headers['content-type'];
        delete this.amzHeaders['x-amz-acl'];
        delete this.amzHeaders['x-amz-content-sha256'];
        this.headers['content-md5'] = Buffer.from(this.md5('')).toString('base64');

        await this.call(S3.METHOD_DELETE, uri);
        return true;
    }

    protected async listObjects(prefix: string = '', maxKeys: number = S3.MAX_PAGE_SIZE, continuationToken: string = ''): Promise<any> {
        if (maxKeys > S3.MAX_PAGE_SIZE) {
            throw new Error(`Cannot list more than ${S3.MAX_PAGE_SIZE} objects`);
        }

        const uri = '/';
        prefix = prefix.replace(/^\//, '');
        this.headers['content-type'] = 'text/plain';
        this.headers['content-md5'] = Buffer.from(this.md5('')).toString('base64');

        delete this.amzHeaders['x-amz-content-sha256'];
        delete this.amzHeaders['x-amz-acl'];

        const parameters: Record<string, string> = {
            'list-type': '2',
            'prefix': prefix,
            'max-keys': maxKeys.toString(),
        };

        if (continuationToken) {
            parameters['continuation-token'] = continuationToken;
        }

        const response = await this.call(S3.METHOD_GET, uri, '', parameters);
        return response.body;
    }

    async deletePath(path: string): Promise<boolean> {
        path = `${this.getRoot()}/${path}`;

        const uri = '/';
        let continuationToken = '';

        do {
            const objects = await this.listObjects(path, S3.MAX_PAGE_SIZE, continuationToken);
            const count = parseInt(objects['KeyCount'] || '1');

            if (count < 1) break;

            continuationToken = objects['NextContinuationToken'] || '';
            let body = '<Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/">';

            if (count > 1) {
                for (const object of objects['Contents']) {
                    body += `<Object><Key>${object['Key']}</Key></Object>`;
                }
            } else {
                body += `<Object><Key>${objects['Contents']['Key']}</Key></Object>`;
            }

            body += '<Quiet>true</Quiet></Delete>';

            this.amzHeaders['x-amz-content-sha256'] = this.sha256(body);
            this.headers['content-md5'] = Buffer.from(this.md5(body)).toString('base64');
            await this.call(S3.METHOD_POST, uri, body, { delete: '' });
        } while (continuationToken);

        return true;
    }

    async exists(path: string): Promise<boolean> {
        try {
            await this.getInfo(path);
            return true;
        } catch {
            return false;
        }
    }

    async getFileSize(path: string): Promise<number> {
        const response = await this.getInfo(path);
        return parseInt(response['content-length'] || '0');
    }

    async getFileMimeType(path: string): Promise<string> {
        const response = await this.getInfo(path);
        return response['content-type'] || '';
    }

    async getFileHash(path: string): Promise<string> {
        const etag = (await this.getInfo(path))['etag'] || '';
        return etag ? etag.slice(1, -1) : etag;
    }

    async createDirectory(path: string): Promise<boolean> {
        return true; // S3 doesn't have directories
    }

    async getDirectorySize(path: string): Promise<number> {
        return -1;
    }

    async getPartitionFreeSpace() {
        return -1;
    }

    async getFiles(dir: string, max: number = S3.MAX_PAGE_SIZE, continuationToken: string = ''): Promise<any> {
        const data = await this.listObjects(dir, max, continuationToken);
        data['IsTruncated'] = data['IsTruncated'] === 'true';
        data['KeyCount'] = parseInt(data['KeyCount']);
        data['MaxKeys'] = parseInt(data['MaxKeys']);
        return data;
    }

    private async getInfo(path: string): Promise<Record<string, string>> {
        delete this.headers['content-type'];
        delete this.amzHeaders['x-amz-acl'];
        delete this.amzHeaders['x-amz-content-sha256'];
        this.headers['content-md5'] = Buffer.from(this.md5('')).toString('base64');

        const uri = path !== '' ? `/${encodeURIComponent(path).replace(/%2F/g, '/')}` : '/';
        const response = await this.call(S3.METHOD_HEAD, uri);
        return response.headers;
    }

    protected getSignatureV4(method: string, uri: string, parameters: Record<string, string> = {}): string {
        const service = 's3';
        const region = this.region;
        const algorithm = 'AWS4-HMAC-SHA256';
        const combinedHeaders: Record<string, string> = {};

        const amzDateStamp = this.amzHeaders['x-amz-date'].substring(0, 8);

        // Combine headers
        for (const [k, v] of Object.entries(this.headers)) {
            combinedHeaders[k.toLowerCase()] = v.trim();
        }

        for (const [k, v] of Object.entries(this.amzHeaders)) {
            combinedHeaders[k.toLowerCase()] = v.trim();
        }

        // Sort headers
        const sortedHeaders = Object.keys(combinedHeaders).sort();
        const sortedCombinedHeaders: Record<string, string> = {};
        for (const key of sortedHeaders) {
            sortedCombinedHeaders[key] = combinedHeaders[key];
        }

        // Sort parameters
        const sortedParams = Object.keys(parameters).sort();
        const queryString = sortedParams.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`).join('&');

        // Create canonical request
        const canonicalRequest = [
            method,
            uri.split('?')[0],
            queryString,
            ...Object.entries(sortedCombinedHeaders).map(([k, v]) => `${k}:${v}`),
            '',
            Object.keys(sortedCombinedHeaders).join(';'),
            this.amzHeaders['x-amz-content-sha256']
        ].join('\n');

        // Create string to sign
        const credentialScope = [amzDateStamp, region, service, 'aws4_request'].join('/');
        const stringToSign = [
            algorithm,
            this.amzHeaders['x-amz-date'],
            credentialScope,
            this.sha256(canonicalRequest)
        ].join('\n');

        // Calculate signature
        const kSecret = `AWS4${this.secretKey}`;
        const kDate = this.hmacSha256(amzDateStamp, kSecret);
        const kRegion = this.hmacSha256(region, kDate);
        const kService = this.hmacSha256(service, kRegion);
        const kSigning = this.hmacSha256('aws4_request', kService);
        const signature = this.hmacSha256(stringToSign, kSigning, 'hex');

        return `${algorithm} Credential=${this.accessKey}/${credentialScope},SignedHeaders=${Object.keys(sortedCombinedHeaders).join(';')},Signature=${signature}`;
    }

    protected async call(method: string, uri: string, data: string | Buffer = '', parameters: Record<string, string> = {}, decode: boolean = true): Promise<any> {
        const crypto = await import('crypto');

        uri = this.getAbsolutePath(uri);
        const queryString = Object.keys(parameters).length ? '?' + Object.entries(parameters).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
        const url = `https://${this.headers['host']}${uri}${queryString}`;

        this.amzHeaders['x-amz-date'] = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');

        if (!this.amzHeaders['x-amz-content-sha256']) {
            this.amzHeaders['x-amz-content-sha256'] = this.sha256(data);
        }

        const headers: Record<string, string> = {};

        for (const [header, value] of Object.entries(this.amzHeaders)) {
            if (value.length > 0) {
                headers[header] = value;
            }
        }

        this.headers['date'] = new Date().toUTCString();

        for (const [header, value] of Object.entries(this.headers)) {
            if (value.length > 0) {
                headers[header] = value;
            }
        }

        headers['Authorization'] = this.getSignatureV4(method, uri, parameters);

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        if (method === S3.METHOD_PUT || method === S3.METHOD_POST) {
            fetchOptions.body = data;
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key.toLowerCase()] = value;
        });

        let body = await response.text();

        if (decode && (responseHeaders['content-type'] === 'application/xml' || (body.startsWith('<?xml') && responseHeaders['content-type'] !== 'image/svg+xml'))) {
            const xml2js = await import('xml2js');
            const parser = new xml2js.Parser();
            body = await parser.parseStringPromise(body);
        }

        return {
            body,
            headers: responseHeaders,
            code: response.status
        };
    }

    protected md5(data: string | Buffer): Buffer {
        const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        return crypto.createHash('md5').update(buffer).digest();
    }

    protected sha256(data: string | Buffer): string {
        const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    protected hmacSha256(data: string | Buffer, key: string | Buffer, encoding: 'hex' | 'binary' = 'binary'): string | Buffer {
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(dataBuffer);
        return encoding === 'hex' ? hmac.digest('hex') : hmac.digest();
    }
}
