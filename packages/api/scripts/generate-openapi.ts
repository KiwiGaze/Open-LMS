import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateOpenApiDocument } from '../src/openapi.ts';

const outputPath = fileURLToPath(new URL('../../../openapi/openapi.json', import.meta.url));
const document = generateOpenApiDocument();

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`Generated OpenAPI document at ${outputPath}`);
