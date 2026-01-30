import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FileSystemPort, TemplateLoaderPort } from '../../app/ports/index.js';
import { TemplateLoadError } from '../../domain/errors/index.js';
import type { Result } from '../../domain/types/result.js';
import { err, ok } from '../../domain/types/result.js';

export class FileTemplateLoaderAdapter implements TemplateLoaderPort {
  private packageRoot: string | null = null;

  constructor(private fs: FileSystemPort) {}

  async loadTemplate(relativePath: string): Promise<Result<string, TemplateLoadError>> {
    const packageRoot = await this.findPackageRoot();
    const templatePath = join(packageRoot, 'templates', relativePath);

    const result = await this.fs.readFile(templatePath);

    if (result.ok) {
      return ok(result.value);
    }

    return err(
      new TemplateLoadError(`Failed to load template: ${result.error.message}`, relativePath)
    );
  }

  async loadFileAsset(relativePath: string): Promise<Result<string, TemplateLoadError>> {
    const packageRoot = await this.findPackageRoot();
    const assetPath = join(packageRoot, 'files', relativePath);

    const result = await this.fs.readFile(assetPath);

    if (result.ok) {
      return ok(result.value);
    }

    return err(
      new TemplateLoadError(`Failed to load file asset: ${result.error.message}`, relativePath)
    );
  }

  private async findPackageRoot(): Promise<string> {
    if (this.packageRoot) {
      return this.packageRoot;
    }

    const currentFile = fileURLToPath(import.meta.url);
    let current = dirname(currentFile);

    for (let i = 0; i < 8; i += 1) {
      if (existsSync(join(current, 'package.json'))) {
        this.packageRoot = current;
        return current;
      }

      const parent = dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }

    throw new TemplateLoadError(
      `Could not locate package.json starting from ${currentFile}`,
      'package-root-not-found'
    );
  }
}
