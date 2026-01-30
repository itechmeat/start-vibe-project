import { existsSync } from 'node:fs';
import {
  access,
  constants,
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { isAbsolute, parse, relative, resolve, sep } from 'node:path';
import type { FileSystemPort } from '../../app/ports/index.js';
import { FileSystemError, PathSecurityError } from '../../domain/errors/index.js';
import type { Result } from '../../domain/types/result.js';
import { err, ok } from '../../domain/types/result.js';

/**
 * Asserts that target path is within base directory (path traversal protection)
 * Returns Result with PathSecurityError if path escapes base directory
 */
export function assertPathWithin(
  targetPath: string,
  baseDir: string
): Result<void, PathSecurityError> {
  const base = resolve(baseDir);
  const target = resolve(targetPath);

  if (target === base) {
    return err(
      new PathSecurityError('Target path cannot be exactly the base directory', targetPath, {
        baseDir: base,
      })
    );
  }

  const rel = relative(base, target);

  // Cross-drive detection: relative() returns absolute path when on different drives
  if (isAbsolute(rel)) {
    return err(
      new PathSecurityError('Cross-drive path access detected', targetPath, {
        baseDir: base,
        relativePath: rel,
      })
    );
  }

  // Windows: different root detection (C:\ vs D:\)
  const baseRoot = parse(base).root;
  const targetRoot = parse(target).root;
  if (baseRoot !== targetRoot) {
    return err(
      new PathSecurityError('Cross-drive path access detected', targetPath, {
        baseDir: base,
        relativePath: rel,
      })
    );
  }

  // Check for path traversal
  if (rel === '..' || rel.startsWith(`..${sep}`)) {
    return err(
      new PathSecurityError(`Path "${targetPath}" is outside of "${baseDir}"`, targetPath, {
        baseDir: base,
        relativePath: rel,
      })
    );
  }

  return ok(undefined);
}

export class NodeFileSystemAdapter implements FileSystemPort {
  constructor(private baseDir?: string) {}

  private checkPathSecurity(path: string): Result<void, PathSecurityError> {
    if (!this.baseDir) return ok(undefined);
    return assertPathWithin(path, this.baseDir);
  }

  async readFile(path: string): Promise<Result<string, FileSystemError>> {
    try {
      const content = await readFile(path, 'utf8');
      return ok(content);
    } catch (error) {
      return err(
        new FileSystemError(
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path
        )
      );
    }
  }

  async writeFile(
    path: string,
    content: string
  ): Promise<Result<void, FileSystemError | PathSecurityError>> {
    const securityCheck = this.checkPathSecurity(path);
    if (!securityCheck.ok) return securityCheck;

    try {
      await writeFile(path, content, 'utf8');
      return ok(undefined);
    } catch (error) {
      return err(
        new FileSystemError(
          `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path
        )
      );
    }
  }

  async mkdir(path: string, recursive = true): Promise<Result<void, FileSystemError>> {
    try {
      await mkdir(path, { recursive });
      return ok(undefined);
    } catch (error) {
      return err(
        new FileSystemError(
          `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path
        )
      );
    }
  }

  exists(path: string): boolean {
    return existsSync(path);
  }

  async existsAsync(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async readDir(path: string): Promise<Result<string[], FileSystemError>> {
    try {
      const entries = await readdir(path);
      return ok(entries);
    } catch (error) {
      return err(
        new FileSystemError(
          `Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path
        )
      );
    }
  }

  async copyFile(
    src: string,
    dest: string
  ): Promise<Result<void, FileSystemError | PathSecurityError>> {
    const srcSecurityCheck = this.checkPathSecurity(src);
    if (!srcSecurityCheck.ok) return srcSecurityCheck;

    const destSecurityCheck = this.checkPathSecurity(dest);
    if (!destSecurityCheck.ok) return destSecurityCheck;

    try {
      await copyFile(src, dest);
      return ok(undefined);
    } catch (error) {
      return err(
        new FileSystemError(
          `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          src
        )
      );
    }
  }

  async isDirectory(path: string): Promise<Result<boolean, FileSystemError>> {
    try {
      const stats = await stat(path);
      return ok(stats.isDirectory());
    } catch (error) {
      return err(
        new FileSystemError(
          `Failed to check directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path
        )
      );
    }
  }
}
