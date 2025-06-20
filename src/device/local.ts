import { Device } from "../device";
import { Storage } from "../storage";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

export class Local extends Device {
  protected root: string = "temp";
  protected readonly MAX_PAGE_SIZE = 1000;

  constructor(root: string = "") {
    super();
    this.root = root;
  }

  getName(): string {
    return "Local Storage";
  }

  getType(): string {
    return Storage.DEVICE_LOCAL;
  }

  getDescription(): string {
    return "Adapter for Local storage that is in the physical or virtual machine or mounted to it.";
  }

  getRoot(): string {
    return this.root;
  }

  getPath(filename: string, prefix?: string): string {
    return this.getAbsolutePath(path.join(this.getRoot(), filename));
  }

  async upload(
    source: string,
    filePath: string,
    chunk: number = 1,
    chunks: number = 1,
    metadata: Record<string, any> = {},
  ): Promise<number> {
    await this.createDirectory(path.dirname(filePath));

    if (chunks === 1) {
      try {
        await fs.rename(source, filePath);
        return chunks;
      } catch {
        throw new Error(`Can't upload file ${filePath}`);
      }
    }

    const tmp = path.join(
      path.dirname(filePath),
      `tmp_${path.basename(filePath)}`,
      `${path.basename(filePath)}_chunks.log`,
    );
    await this.createDirectory(path.dirname(tmp));

    const chunkFilePath = path.join(
      path.dirname(tmp),
      `${path.parse(filePath).name}.part.${chunk}`,
    );

    if (!(await this.exists(chunkFilePath))) {
      try {
        await fs.appendFile(tmp, `${chunk}\n`);
      } catch {
        throw new Error(`Can't write chunk log ${tmp}`);
      }
    }

    try {
      const chunkLogs = await fs.readFile(tmp, "utf8");
      const chunksReceived = chunkLogs.trim().split("\n").length;

      await fs.rename(source, chunkFilePath);

      if (chunks === chunksReceived) {
        await this.joinChunks(filePath, chunks);
        return chunksReceived;
      }

      return chunksReceived;
    } catch {
      throw new Error(`Failed to write chunk ${chunk}`);
    }
  }

  async uploadData(
    data: string | Buffer,
    filePath: string,
    contentType: string,
    chunk: number = 1,
    chunks: number = 1,
    metadata: Record<string, any> = {},
  ): Promise<number> {
    await this.createDirectory(path.dirname(filePath));

    if (chunks === 1) {
      try {
        await fs.writeFile(filePath, data);
        return chunks;
      } catch {
        throw new Error(`Can't write file ${filePath}`);
      }
    }

    const tmp = path.join(
      path.dirname(filePath),
      `tmp_${path.basename(filePath)}`,
      `${path.basename(filePath)}_chunks.log`,
    );
    await this.createDirectory(path.dirname(tmp));

    try {
      await fs.appendFile(tmp, `${chunk}\n`);
      const chunkLogs = await fs.readFile(tmp, "utf8");
      const chunksReceived = chunkLogs.trim().split("\n").length;

      const chunkFilePath = path.join(
        path.dirname(tmp),
        `${path.parse(filePath).name}.part.${chunk}`,
      );
      await fs.writeFile(chunkFilePath, data);

      if (chunks === chunksReceived) {
        await this.joinChunks(filePath, chunks);
        return chunksReceived;
      }

      return chunksReceived;
    } catch {
      throw new Error(`Failed to write chunk ${chunk}`);
    }
  }

  private async joinChunks(filePath: string, chunks: number): Promise<void> {
    const tmp = path.join(
      path.dirname(filePath),
      `tmp_${path.basename(filePath)}`,
      `${path.basename(filePath)}_chunks.log`,
    );

    for (let i = 1; i <= chunks; i++) {
      const part = path.join(
        path.dirname(tmp),
        `${path.parse(filePath).name}.part.${i}`,
      );

      try {
        const data = await fs.readFile(part);
        await fs.appendFile(filePath, data);
        await fs.unlink(part);
      } catch {
        throw new Error(`Failed to read/append chunk ${part}`);
      }
    }

    await fs.unlink(tmp);
    await fs.rmdir(path.dirname(tmp));
  }

  async transfer(
    filePath: string,
    destination: string,
    device: Device,
  ): Promise<boolean> {
    if (!(await this.exists(filePath))) {
      throw new Error("File Not Found");
    }

    const size = await this.getFileSize(filePath);
    const contentType = await this.getFileMimeType(filePath);

    if (size <= this.transferChunkSize) {
      const source = await this.read(filePath);
      return await device.write(destination, source, contentType);
    }

    const totalChunks = Math.ceil(size / this.transferChunkSize);
    const metadata = { content_type: contentType };

    for (let counter = 0; counter < totalChunks; counter++) {
      const start = counter * this.transferChunkSize;
      const data = await this.read(filePath, start, this.transferChunkSize);
      await device.uploadData(
        data,
        destination,
        contentType,
        counter + 1,
        totalChunks,
        metadata,
      );
    }

    return true;
  }

  async abort(filePath: string, extra: string = ""): Promise<boolean> {
    if (await this.exists(filePath)) {
      await fs.unlink(filePath);
    }

    const tmp = path.join(
      path.dirname(filePath),
      `tmp_${path.basename(filePath)}`,
    );

    if (!(await this.exists(path.dirname(tmp)))) {
      throw new Error(`File doesn't exist: ${path.dirname(filePath)}`);
    }

    const files = await this.getFiles(tmp);
    for (const file of files) {
      await this.delete(file, true);
    }

    return fs
      .rmdir(tmp)
      .then(() => true)
      .catch(() => false);
  }

  async read(
    filePath: string,
    offset: number = 0,
    length?: number,
  ): Promise<Buffer> {
    if (!(await this.exists(filePath))) {
      throw new Error("File Not Found");
    }

    const fileHandle = await fs.open(filePath, "r");
    try {
      const size = length ?? (await fileHandle.stat()).size - offset;
      const buffer = Buffer.alloc(size);
      await fileHandle.read(buffer, 0, size, offset);
      return buffer;
    } finally {
      await fileHandle.close();
    }
  }

  async write(
    filePath: string,
    data: string | Buffer,
    contentType: string = "",
  ): Promise<boolean> {
    try {
      await this.createDirectory(path.dirname(filePath));
      await fs.writeFile(filePath, data);
      return true;
    } catch {
      throw new Error(`Can't write to path ${filePath}`);
    }
  }

  async move(source: string, target: string): Promise<boolean> {
    if (source === target) {
      return false;
    }

    try {
      await this.createDirectory(path.dirname(target));
      await fs.rename(source, target);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filePath: string, recursive: boolean = false): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory() && recursive) {
        const files = await this.getFiles(filePath);
        for (const file of files) {
          await this.delete(file, true);
        }
        await fs.rmdir(filePath);
      } else if (stats.isFile() || stats.isSymbolicLink()) {
        await fs.unlink(filePath);
      }

      return true;
    } catch {
      return false;
    }
  }

  async deletePath(filePath: string): Promise<boolean> {
    const fullPath = path.resolve(path.join(this.getRoot(), filePath));

    try {
      if (!(await this.exists(fullPath))) {
        return false;
      }

      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        return false;
      }

      const files = await this.getFiles(fullPath);
      for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.isDirectory()) {
          const relativePath = file.replace(this.getRoot() + path.sep, "");
          await this.deletePath(relativePath);
        } else {
          await this.delete(file, true);
        }
      }

      await fs.rmdir(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  async getFileMimeType(filePath: string): Promise<string> {
    return this.getMimeType(filePath);
  }

  async getFileHash(filePath: string): Promise<string> {
    const data = await fs.readFile(filePath);
    return createHash("md5").update(data).digest("hex");
  }

  async createDirectory(dirPath: string): Promise<boolean> {
    try {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
      return true;
    } catch {
      return false;
    }
  }

  async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let size = 0;
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        if (file.name.startsWith(".")) continue;

        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          size += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }

      return size;
    } catch {
      return -1;
    }
  }

  async getPartitionFreeSpace(): Promise<number> {
    const stats = await fs.statfs(this.getRoot());
    return stats.bavail * stats.bsize;
  }

  async getPartitionTotalSpace(): Promise<number> {
    const stats = await fs.statfs(this.getRoot());
    return stats.blocks * stats.bsize;
  }

  async getFiles(
    dir: string,
    max: number = this.MAX_PAGE_SIZE,
    continuationToken: string = "",
  ): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries.map((entry) => path.join(dir, entry.name));
    } catch {
      return [];
    }
  }
}
