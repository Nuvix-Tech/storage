# @nuvix/storage

A powerful and flexible S3-compatible storage library for the Nuvix BaaS platform.

## Features

- S3-compatible API for consistent interface
- Adapter-based architecture for multiple storage backends
- Built-in adapters for memory and file system storage
- Clean TypeScript API with full type definitions

## Installation

```bash
npm install @nuvix/storage
```

## Basic Usage

```typescript
import { Storage } from '@nuvix/storage';

// Create a storage client with default file system adapter
const storage = new Storage();

// Create a bucket
await storage.createBucket({ name: 'my-bucket' });

// Upload a file
const content = 'Hello, World!';
const metadata = await storage.upload('my-bucket', 'hello.txt', content, {
  contentType: 'text/plain',
  metadata: { owner: 'user123' }
});

// Download a file
const { data, metadata } = await storage.download('my-bucket', 'hello.txt');

// List objects in a bucket
const results = await storage.listObjects('my-bucket', {
  prefix: 'hello',
  maxKeys: 100
});

// Delete an object
await storage.delete('my-bucket', 'hello.txt');

// Delete a bucket
await storage.deleteBucket('my-bucket');
```

## Adapters

### Memory Storage Adapter

Useful for testing and development:

```typescript
import { Storage, MemoryStorageAdapter } from '@nuvix/storage';

const memoryAdapter = new MemoryStorageAdapter();
const storage = new Storage(memoryAdapter);
```

### File System Adapter

Store files on the local file system:

```typescript
import { Storage, FileSystemStorageAdapter } from '@nuvix/storage';

const fsAdapter = new FileSystemStorageAdapter('/path/to/storage');
const storage = new Storage(fsAdapter);
```

## Creating Custom Adapters

You can create custom storage adapters by implementing the `StorageAdapter` interface or extending the `BaseStorageAdapter` class:

```typescript
import { BaseStorageAdapter, StorageMetadata } from '@nuvix/storage';

export class CustomStorageAdapter extends BaseStorageAdapter {
  // Implement abstract methods
}
```

## License

MIT 