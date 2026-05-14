import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative } from 'node:path';

export type FileStorageProviderName = 'local_fs';

export type UploadFileInput = {
  tenantId: string;
  fileResourceId: string;
  bytes: Uint8Array;
};

export type StoredFile = {
  storageProvider: FileStorageProviderName;
  storageKey: string;
};

export type FileStorageProvider = {
  upload: (input: UploadFileInput) => Promise<StoredFile>;
  download: (storageKey: string) => Promise<Uint8Array>;
  delete: (storageKey: string) => Promise<void>;
};

export class LocalFileStorageProvider implements FileStorageProvider {
  readonly #rootDirectory: string;

  constructor(rootDirectory: string) {
    this.#rootDirectory = normalize(rootDirectory);
  }

  async upload(input: UploadFileInput): Promise<StoredFile> {
    const storageKey = `${input.tenantId}/${input.fileResourceId}`;
    const absolutePath = this.#resolveStorageKey(storageKey);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.bytes);

    return {
      storageProvider: 'local_fs',
      storageKey,
    };
  }

  async download(storageKey: string): Promise<Uint8Array> {
    try {
      const bytes = await readFile(this.#resolveStorageKey(storageKey));
      return new Uint8Array(bytes);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new Error('File content was not found. Upload the file again or contact support.');
      }

      throw error;
    }
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.#resolveStorageKey(storageKey), { force: true });
  }

  #resolveStorageKey(storageKey: string): string {
    const absolutePath = normalize(join(this.#rootDirectory, storageKey));
    const pathFromRoot = relative(this.#rootDirectory, absolutePath);

    if (pathFromRoot.startsWith('..')) {
      throw new Error('File storage key is outside the configured storage root.');
    }

    return absolutePath;
  }
}
