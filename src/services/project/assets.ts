import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export async function loadTemplate(relativePath: string): Promise<string> {
  const packageRoot = findPackageRoot(dirname(fileURLToPath(import.meta.url)));
  const templatesRoot = join(packageRoot, 'templates');
  const templatePath = join(templatesRoot, relativePath);

  try {
    return await readFile(templatePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load template at ${templatePath}: ${message}`);
  }
}

export async function loadFileAsset(relativePath: string): Promise<string> {
  const packageRoot = findPackageRoot(dirname(fileURLToPath(import.meta.url)));
  const filesRoot = join(packageRoot, 'files');
  const assetPath = join(filesRoot, relativePath);

  try {
    return await readFile(assetPath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load file asset at ${assetPath}: ${message}`);
  }
}

function findPackageRoot(startDir: string): string {
  let current = startDir;

  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }

    current = parent;
  }

  throw new Error(`Could not locate package.json starting from ${startDir}`);
}
