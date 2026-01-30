/**
 * Branded types for domain primitives
 * Prevents accidental mixing of semantically different string values
 */

import { ValidationError } from '../errors/index.js';
import type { Result } from '../types/result.js';
import { err, ok } from '../types/result.js';

export type Brand<K, T> = K & { readonly __brand: T };

/** Validated project name */
export type ProjectName = Brand<string, 'ProjectName'>;

/** Agent identifier */
export type AgentId = Brand<string, 'AgentId'>;

/** Stack identifier (frontend/backend/database) */
export type StackId = Brand<string, 'StackId'>;

/** Skill identifier */
export type SkillId = Brand<string, 'SkillId'>;

/** Template identifier */
export type TemplateId = Brand<string, 'TemplateId'>;

/**
 * Creates a branded ProjectName from a validated string value
 * Returns Result with ValidationError on invalid input
 */
export function createProjectName(value: string): Result<ProjectName, ValidationError> {
  if (!value || value.length === 0) {
    return err(new ValidationError('Project name cannot be empty', { value }));
  }
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return err(
      new ValidationError(
        'Project name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens',
        { value }
      )
    );
  }
  return ok(value as ProjectName);
}

export function createAgentId(value: string): Result<AgentId, ValidationError> {
  if (!value || value.length === 0) {
    return err(new ValidationError('Agent ID cannot be empty', { value }));
  }
  return ok(value as AgentId);
}

export function createStackId(value: string): Result<StackId, ValidationError> {
  if (!value || value.length === 0) {
    return err(new ValidationError('Stack ID cannot be empty', { value }));
  }
  return ok(value as StackId);
}

export function createSkillId(value: string): Result<SkillId, ValidationError> {
  if (!value || value.length === 0) {
    return err(new ValidationError('Skill ID cannot be empty', { value }));
  }
  return ok(value as SkillId);
}

export function createTemplateId(value: string): Result<TemplateId, ValidationError> {
  if (!value || value.length === 0) {
    return err(new ValidationError('Template ID cannot be empty', { value }));
  }
  return ok(value as TemplateId);
}
