#!/usr/bin/env node

/**
 * Syncs python/pyproject.toml version with packages/core/package.json.
 *
 * Run automatically after `changeset version` via the `version-packages` script.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkgPath = join(root, 'packages/core/package.json');
const pyprojectPath = join(root, 'python/pyproject.toml');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const pyproject = readFileSync(pyprojectPath, 'utf-8');

const updated = pyproject.replace(/^version = ".*"$/m, `version = "${pkg.version}"`);

if (updated !== pyproject) {
    writeFileSync(pyprojectPath, updated);
    console.log(`python/pyproject.toml: version -> ${pkg.version}`);
} else {
    console.log('python/pyproject.toml already in sync.');
}
