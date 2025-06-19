# @nuvix/storage

A powerful, TypeScript-first S3-compatible storage library for the Nuvix BaaS platform. Supports multiple storage backends including local filesystem, AWS S3, Wasabi, and MinIO with a unified API.

## ✨ Features

- 🚀 **S3-Compatible API** - Consistent interface across all storage providers
- 🔌 **Multiple Storage Backends** - Local, AWS S3, Wasabi, MinIO, and more
- 📝 **TypeScript First** - Full type safety with comprehensive TypeScript definitions
- ✅ **File Validation** - Built-in validators for file types, sizes, names, and extensions
- 🔄 **Chunked Uploads** - Support for large file uploads with multipart upload
- 🌐 **Modern Builds** - ESM and CommonJS support for maximum compatibility
- 🧪 **Well Tested** - Comprehensive test suite with real implementation testing

## 📦 Installation

```bash
# Using npm
npm install @nuvix/storage

# Using yarn
yarn add @nuvix/storage

# Using pnpm
pnpm add @nuvix/storage

# Using bun
bun add @nuvix/storage
```

## 🚀 Quick Start

### ESM (Modern)
```typescript
import { Storage, Local, Wasabi, MinIO, FileExt, FileSize } from '@nuvix/storage';

// Set up local storage
const localStorage = new Local('./uploads');
Storage.setDevice(Storage.DEVICE_LOCAL, localStorage);

// Upload a file
const localDevice = Storage.getDevice(Storage.DEVICE_LOCAL);
await localDevice.write('test.txt', 'Hello, World!', 'text/plain');
```

### CommonJS (Legacy)
```javascript
const { Storage, Local, Wasabi, MinIO } = require('@nuvix/storage');

// Set up local storage
const localStorage = new Local('./uploads');
Storage.setDevice(Storage.DEVICE_LOCAL, localStorage);
```

## 🔧 Storage Devices

### Local File System
```typescript
import { Local, Storage } from '@nuvix/storage';

const localStorage = new Local('./uploads');
Storage.setDevice('local', localStorage);

// Write file
await localStorage.write('documents/file.txt', 'content', 'text/plain');

// Read file
const content = await localStorage.read('documents/file.txt');

// Check if file exists
const exists = await localStorage.exists('documents/file.txt');
```

### Wasabi Cloud Storage
```typescript
import { Wasabi, Storage } from '@nuvix/storage';

const wasabiStorage = new Wasabi(
  'my-app-uploads',           // root path
  'your-access-key',          // access key
  'your-secret-key',          // secret key
  'your-bucket-name',         // bucket name
  Wasabi.US_CENTRAL_1,        // region
  Wasabi.ACL_PRIVATE          // ACL (optional)
);

Storage.setDevice('wasabi', wasabiStorage);

// Upload with metadata
await wasabiStorage.uploadData(
  'Hello, Cloud!', 
  'cloud-file.txt', 
  'text/plain',
  1, 1, 
  { author: 'user123' }
);
```

### AWS S3
```typescript
import { S3, Storage } from '@nuvix/storage';

const s3Storage = new S3(
  'my-app-uploads',           // root path
  'your-access-key',          // access key
  'your-secret-key',          // secret key
  'your-bucket-name',         // bucket name
  S3.US_EAST_1,              // region
  S3.ACL_PRIVATE             // ACL (optional)
);

Storage.setDevice('s3', s3Storage);
```

### MinIO
```typescript
import { MinIO, Storage } from '@nuvix/storage';

const minioStorage = new MinIO(
  'my-app-uploads',           // root path
  'minioadmin',               // access key (default MinIO credentials)
  'minioadmin',               // secret key (default MinIO credentials)
  'your-bucket-name',         // bucket name
  'localhost:9000',           // MinIO endpoint
  MinIO.ACL_PRIVATE,          // ACL (optional)
  false                       // useSSL (optional, default: false)
);

Storage.setDevice('minio', minioStorage);

// Upload to MinIO
await minioStorage.write('local-file.txt', 'Hello, MinIO!', 'text/plain');

// Read from MinIO
const content = await minioStorage.read('local-file.txt');

// Check if file exists
const exists = await minioStorage.exists('local-file.txt');

// Get file information
const size = await minioStorage.getFileSize('local-file.txt');
const mimeType = await minioStorage.getFileMimeType('local-file.txt');
```

## 🛡️ File Validation

### File Extension Validation
```typescript
import { FileExt } from '@nuvix/storage';

const imageValidator = new FileExt(['jpg', 'png', 'gif', 'webp']);

console.log(imageValidator.isValid('photo.jpg'));    // true
console.log(imageValidator.isValid('document.pdf')); // false
```

### File Size Validation
```typescript
import { FileSize } from '@nuvix/storage';

const sizeValidator = new FileSize(5 * 1024 * 1024); // 5MB limit

console.log(sizeValidator.isValid(1024 * 1024));     // true (1MB)
console.log(sizeValidator.isValid(10 * 1024 * 1024)); // false (10MB)
```

### File Name Validation
```typescript
import { FileName } from '@nuvix/storage';

const nameValidator = new FileName();

console.log(nameValidator.isValid('validfile123.txt')); // true
console.log(nameValidator.isValid('invalid-file.txt'));  // false (contains hyphen)
```

### File Type (MIME) Validation
```typescript
import { FileType } from '@nuvix/storage';

const typeValidator = new FileType(['jpeg', 'png', 'gif']);

// Validates based on file content, not extension
console.log(await typeValidator.isValid('./image.jpg')); // true if actual JPEG
```

### Upload File Validation
```typescript
import { Upload } from '@nuvix/storage';

const uploadValidator = new Upload();

console.log(await uploadValidator.isValid('./existing-file.txt')); // true
console.log(await uploadValidator.isValid('./non-existent.txt'));  // false
```

## 🔄 Advanced Features

### Chunked Uploads
```typescript
// Upload large files in chunks
const chunks = ['chunk1', 'chunk2', 'chunk3'];
const metadata = {};

for (let i = 0; i < chunks.length; i++) {
  await device.uploadData(
    chunks[i], 
    'large-file.txt', 
    'text/plain',
    i + 1,           // current chunk
    chunks.length,   // total chunks
    metadata
  );
}
```

### File Transfer Between Devices
```typescript
const sourceDevice = Storage.getDevice('local');
const targetDevice = Storage.getDevice('wasabi');

// Transfer file from local to cloud
await sourceDevice.transfer(
  'local-file.txt',
  'cloud-file.txt',
  targetDevice
);
```

### Human-Readable File Sizes
```typescript
import { Storage } from '@nuvix/storage';

console.log(Storage.human(1024));           // "1.00kB"
console.log(Storage.human(1048576));        // "1.00MB"
console.log(Storage.human(1024, 2, 'binary')); // "1.00KiB"
```

## 🏗️ Building

The library is built using Rollup and provides both ESM and CommonJS outputs:

```bash
# Build for production
bun run build

# Build and watch for changes
bun run build:watch

# Clean build directory
bun run clean
```

## 🧪 Testing

Comprehensive test suite with real implementation testing:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test files
bun test storage.test.ts
bun test device/
bun test validator/
```

### Testing with Real Cloud Storage

Set environment variables to test against real storage services:

```bash
# For Wasabi testing
export WASABI_ACCESS_KEY="your-access-key"
export WASABI_SECRET_KEY="your-secret-key"
export WASABI_BUCKET="your-test-bucket"

# For AWS S3 testing
export AWS_ACCESS_KEY="your-access-key"
export AWS_SECRET_KEY="your-secret-key"
export AWS_BUCKET="your-test-bucket"

# For MinIO testing
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"
export MINIO_BUCKET="test-bucket"
export MINIO_ENDPOINT="localhost:9000"
```

## 📝 API Reference

### Storage Class
- `Storage.setDevice(name, device)` - Register a storage device
- `Storage.getDevice(name)` - Get a registered storage device
- `Storage.exists(name)` - Check if a device is registered
- `Storage.human(bytes, decimals?, system?)` - Format bytes to human-readable string

### Device Interface
All storage devices implement the same interface:
- `upload(source, path, chunk?, chunks?, metadata?)` - Upload file
- `uploadData(data, path, contentType, chunk?, chunks?, metadata?)` - Upload data
- `read(path, offset?, length?)` - Read file content
- `write(path, data, contentType)` - Write file
- `delete(path, recursive?)` - Delete file/directory
- `exists(path)` - Check if file exists
- `getFileSize(path)` - Get file size
- `getFileMimeType(path)` - Get file MIME type
- `getFileHash(path)` - Get file MD5 hash
- `transfer(source, destination, targetDevice)` - Transfer file

## 🌍 Browser Support

This library is designed for Node.js environments. For browser usage, you'll need to provide polyfills for Node.js modules or use a bundler that can handle Node.js dependencies.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and ensure all tests pass:

```bash
bun run lint        # Check code style
bun run lint:fix    # Fix code style issues
bun test           # Run test suite
```

## 📄 License

MIT © [Nuvix](https://github.com/nuvix-tech/storage)

## 🔗 Links

- [GitHub Repository](https://github.com/nuvix-tech/storage)
- [NPM Package](https://www.npmjs.com/package/@nuvix/storage)
- [Documentation](https://github.com/nuvix-tech/storage#readme)
- [Issue Tracker](https://github.com/nuvix-tech/storage/issues) 
