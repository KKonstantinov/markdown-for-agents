#!/usr/bin/env node

/**
 * Syncs each jsr.json with its sibling package.json:
 *   - "version" field
 *   - "imports" map (dependencies + peerDependencies -> npm: specifiers)
 *
 * Workspace dependencies (workspace:*) are resolved to the actual version
 * from the referenced package.json in the monorepo.
 *
 * Run automatically after `changeset version` via the `version-packages` script.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const jsrFiles = execSync('find packages -name jsr.json', {
    cwd: root,
    encoding: 'utf-8'
})
    .trim()
    .split('\n')
    .filter(Boolean);

/** Cache of package name -> version for workspace packages */
const workspaceVersions = new Map();

/**
 * Resolve a workspace dependency version by finding the matching package.json
 * in the monorepo.
 */
function resolveWorkspaceVersion(packageName) {
    if (workspaceVersions.has(packageName)) {
        return workspaceVersions.get(packageName);
    }

    // Find all package.json files and look for the matching name
    const pkgFiles = execSync('find packages -name package.json -not -path "*/node_modules/*"', {
        cwd: root,
        encoding: 'utf-8'
    })
        .trim()
        .split('\n')
        .filter(Boolean);

    for (const relPath of pkgFiles) {
        const pkg = JSON.parse(readFileSync(join(root, relPath), 'utf-8'));
        if (pkg.name && pkg.version) {
            workspaceVersions.set(pkg.name, pkg.version);
        }
    }

    return workspaceVersions.get(packageName);
}

/**
 * Build the JSR imports map from package.json dependencies and peerDependencies.
 * - workspace:* deps are resolved to ^<actual version>
 * - Regular deps keep their version range
 * - devDependencies are excluded (they're not needed at runtime)
 */
function buildImportsMap(pkg) {
    const imports = {};
    const allDeps = {
        ...pkg.dependencies,
        ...pkg.peerDependencies
    };

    for (const [name, version] of Object.entries(allDeps)) {
        if (version.startsWith('workspace:')) {
            const resolved = resolveWorkspaceVersion(name);
            if (resolved) {
                imports[name] = `npm:${name}@^${resolved}`;
            } else {
                console.warn(`  WARNING: Could not resolve workspace version for ${name}`);
                imports[name] = `npm:${name}@*`;
            }
        } else {
            imports[name] = `npm:${name}@${version}`;
        }
    }

    return Object.keys(imports).length > 0 ? imports : undefined;
}

let changed = 0;

for (const relPath of jsrFiles) {
    const jsrPath = join(root, relPath);
    const pkgPath = join(dirname(jsrPath), 'package.json');

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const jsr = JSON.parse(readFileSync(jsrPath, 'utf-8'));
    const original = JSON.stringify(jsr);

    // Sync version
    if (jsr.version !== pkg.version) {
        console.log(`${relPath}: version ${jsr.version} -> ${pkg.version}`);
        jsr.version = pkg.version;
    }

    // Sync imports map
    const imports = buildImportsMap(pkg);
    if (imports) {
        if (JSON.stringify(jsr.imports) !== JSON.stringify(imports)) {
            console.log(`${relPath}: imports updated`);
            jsr.imports = imports;
        }
    } else if (jsr.imports) {
        // No deps, remove stale imports
        console.log(`${relPath}: imports removed (no dependencies)`);
        delete jsr.imports;
    }

    if (JSON.stringify(jsr) !== original) {
        writeFileSync(jsrPath, JSON.stringify(jsr, null, 4) + '\n');
        changed++;
    }
}

if (changed === 0) {
    console.log('All jsr.json files already in sync.');
} else {
    console.log(`\nSynced ${changed} jsr.json file(s).`);
}
