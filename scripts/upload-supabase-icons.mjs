import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_ICONS_BUCKET || 'icons';
const ICONS_SOURCE_DIR = process.env.ICONS_SOURCE_DIR;
const UPSERT = /^(1|true|yes)$/i.test(process.env.SUPABASE_ICONS_UPSERT || 'true');
const SYNC_ICON_LIBRARY = /^(1|true|yes)$/i.test(process.env.SYNC_ICON_LIBRARY || 'true');
const UPLOAD_BATCH_SIZE = Math.max(1, Number.parseInt(process.env.SUPABASE_UPLOAD_BATCH_SIZE || '5', 10) || 5);
const UPLOAD_RETRY_COUNT = Math.max(0, Number.parseInt(process.env.SUPABASE_UPLOAD_RETRY_COUNT || '5', 10) || 5);
const UPLOAD_RETRY_BASE_DELAY_MS = Math.max(
  100,
  Number.parseInt(process.env.SUPABASE_UPLOAD_RETRY_BASE_DELAY_MS || '1000', 10) || 1000
);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!ICONS_SOURCE_DIR) {
  console.error('Missing ICONS_SOURCE_DIR');
  process.exit(1);
}

const baseUrl = SUPABASE_URL.replace(/\/+$/, '');
const sourceRoot = path.resolve(ICONS_SOURCE_DIR);

function authHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function readErrorBody(response) {
  try {
    return await response.text();
  } catch {
    return '<unable to read response body>';
  }
}

function formatError(error) {
  const parts = [error?.message || String(error)];
  if (error?.cause?.message) {
    parts.push(`cause: ${error.cause.message}`);
  }
  return parts.join('\n');
}

function toTitleCase(value) {
  return value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function stripNumericPrefix(value) {
  return value.replace(/^\d+[\s._-]*/, '');
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/\.svg$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((item) => item.trim()).filter(Boolean))];
}

function toStoragePath(filePath) {
  return path.relative(sourceRoot, filePath).split(path.sep).join('/');
}

function encodeObjectPath(storagePath) {
  return storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function isRetryableError(error) {
  if (typeof error?.status === 'number') {
    return isRetryableStatus(error.status);
  }

  return true;
}

async function collectSvgFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSvgFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      files.push(fullPath);
    }
  }

  return files;
}

function buildIconRow(storagePath) {
  const segments = storagePath.split('/');
  const fileName = segments[segments.length - 1];
  const folderSegments = segments.slice(0, -1);
  const normalizedFileName = stripNumericPrefix(fileName);
  const slug = normalizeSlug(normalizedFileName);
  const category = folderSegments[0] || 'general';
  const tags = unique([...folderSegments, ...slug.split('-')]);
  const keywords = unique([slug.replace(/-/g, ' '), ...slug.split('-'), ...folderSegments]);

  return {
    name: toTitleCase(slug),
    slug,
    storage_path: storagePath,
    public_url: `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`,
    keywords,
    category,
    tags,
  };
}

async function uploadSvg(filePath) {
  const storagePath = toStoragePath(filePath);
  const body = await fs.readFile(filePath);

  for (let attempt = 0; attempt <= UPLOAD_RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(
        `${baseUrl}/storage/v1/object/${encodeURIComponent(BUCKET_NAME)}/${encodeObjectPath(storagePath)}`,
        {
          method: 'POST',
          headers: authHeaders({
            'Content-Type': 'image/svg+xml',
            'x-upsert': UPSERT ? 'true' : 'false',
          }),
          body,
        }
      );

      if (!response.ok) {
        const error = new Error(
          `Upload failed for ${storagePath}: ${response.status} ${await readErrorBody(response)}`
        );
        error.status = response.status;
        throw error;
      }

      return storagePath;
    } catch (error) {
      if (attempt >= UPLOAD_RETRY_COUNT || !isRetryableError(error)) {
        throw error;
      }

      const delayMs = UPLOAD_RETRY_BASE_DELAY_MS * 2 ** attempt;
      console.warn(
        `Retrying ${storagePath} after attempt ${attempt + 1} failed. Waiting ${delayMs}ms.\n${formatError(error)}`
      );
      await sleep(delayMs);
    }
  }

  throw new Error(`Upload failed for ${storagePath}: exhausted retries`);
}

async function upsertIconLibraryRows(rows) {
  if (!rows.length) {
    return;
  }

  const response = await fetch(`${baseUrl}/rest/v1/icon_library`, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`icon_library upsert failed: ${response.status} ${await readErrorBody(response)}`);
  }
}

async function main() {
  const files = await collectSvgFiles(sourceRoot);

  if (!files.length) {
    console.error(`No SVG files found under ${sourceRoot}`);
    process.exit(1);
  }

  const uploadedStoragePaths = [];

  for (let index = 0; index < files.length; index += UPLOAD_BATCH_SIZE) {
    const chunk = files.slice(index, index + UPLOAD_BATCH_SIZE);
    console.log(`Uploading files ${index + 1}-${index + chunk.length} of ${files.length}...`);
    const uploaded = await Promise.all(chunk.map((filePath) => uploadSvg(filePath)));
    uploadedStoragePaths.push(...uploaded);
  }

  if (SYNC_ICON_LIBRARY) {
    const rows = uploadedStoragePaths.map(buildIconRow);
    for (let index = 0; index < rows.length; index += 100) {
      const chunk = rows.slice(index, index + 100);
      console.log(`Upserting icon_library rows ${index + 1}-${index + chunk.length} of ${rows.length}...`);
      await upsertIconLibraryRows(chunk);
    }
  }

  console.log(
    JSON.stringify(
      {
        bucket: BUCKET_NAME,
        sourceDir: sourceRoot,
        uploadedFiles: uploadedStoragePaths.length,
        syncedIconLibrary: SYNC_ICON_LIBRARY,
        uploadBatchSize: UPLOAD_BATCH_SIZE,
        uploadRetryCount: UPLOAD_RETRY_COUNT,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
