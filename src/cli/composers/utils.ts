import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import trash from 'trash';
import { ValidationError } from '../../domain/errors/index.js';

/**
 * Assert that a target path is strictly within a base directory
 * @throws ValidationError if path is not within base or equals base
 */
export function assertPathWithin(baseDir: string, targetPath: string): string {
  const base = resolve(baseDir);
  const target = resolve(targetPath);

  if (target === base) {
    throw new ValidationError(`Refusing to remove path: target must be strictly inside ${base}`);
  }

  if (!target.startsWith(`${base}${sep}`)) {
    throw new ValidationError(`Refusing to remove path: target must be strictly inside ${base}`);
  }

  return target;
}

/**
 * Safely move a path to trash with path traversal protection
 */
export async function safeTrashPath(targetPath: string, baseDir: string): Promise<void> {
  if (!existsSync(targetPath)) {
    return;
  }

  const safePath = assertPathWithin(baseDir, targetPath);
  await trash([safePath], { glob: false });
}
