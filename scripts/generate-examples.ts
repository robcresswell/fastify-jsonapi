#!/usr/bin/env -S node --no-warnings --import=tsx/esm

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function main() {
  const examplesDir = join(import.meta.dirname, '..', 'examples');
  const exampleFiles = await readdir(examplesDir, { withFileTypes: true });

  const exampleMdContentArr: string[] = [
    '# Examples',
    'See the [JSON:API website](https://jsonapi.org/) for detailed examples on the spec itself',
  ];
  for (const { parentPath, name } of exampleFiles) {
    if (!name.endsWith('.ts')) continue;

    const fileContents = await readFile(join(parentPath, name), {
      encoding: 'utf-8',
    });
    const title = name.slice(0, -3).split('-').map(capitalise).join(' ');

    exampleMdContentArr.push(`## ${title}`);
    exampleMdContentArr.push(
      `\`\`\`ts\n${fileContents.replace(
        '../src/index.js',
        '@robcresswell/fastify-jsonapi',
      )}\n\`\`\``,
    );
  }

  const exampleMdContent = exampleMdContentArr.join('\n\n') + '\n';
  const exampleMdPath = join(examplesDir, '..', 'EXAMPLES.md');

  await writeFile(exampleMdPath, exampleMdContent, { encoding: 'utf-8' });
}

main().catch((err: unknown) => {
  console.error(err);
});
