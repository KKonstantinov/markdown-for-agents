#!/usr/bin/env node

/**
 * Syncs the "version" field in each jsr.json with its sibling package.json.
 * Run automatically after `changeset version` via the `version-packages` script.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { globSync } from 'node:fs';

// Use a simple recursive glob since we're in an ESM context
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const jsrFiles = execSync('find packages -name jsr.json', {
    cwd: root,
    encoding: 'utf-8'
})
    .trim()
    .split('\n')
    .filter(Boolean);

let changed = 0;

for (const relPath of jsrFiles) {
    const jsrPath = join(root, relPath);
    const pkgPath = join(dirname(jsrPath), 'package.json');

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const jsr = JSON.parse(readFileSync(jsrPath, 'utf-8'));

    if (jsr.version !== pkg.version) {
        console.log(`${relPath}: ${jsr.version} -> ${pkg.version}`);
        jsr.version = pkg.version;
        writeFileSync(jsrPath, JSON.stringify(jsr, null, 4) + '\n');
        changed++;
    }
}

if (changed === 0) {
    console.log('All jsr.json versions already in sync.');
} else {
    console.log(`\nSynced ${changed} jsr.json file(s).`);
}
