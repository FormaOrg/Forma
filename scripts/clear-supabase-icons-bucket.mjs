import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_ICONS_BUCKET || 'icons';
const PAGE_SIZE = Number(process.env.SUPABASE_ICONS_PAGE_SIZE || 1000);
const DELETE_ICON_LIBRARY_ROWS = /^(1|true|yes)$/i.test(
  process.env.DELETE_ICON_LIBRARY_ROWS || 'false'
);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const baseUrl = SUPABASE_URL.replace(/\/+$/, '');

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

function encodeObjectPath(storagePath) {
  return storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function listAllFiles() {
  const files = [];
  let offset = 0;

  while (true) {
    const response = await fetch(`${baseUrl}/storage/v1/object/list/${encodeURIComponent(BUCKET_NAME)}`, {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        prefix: '',
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Storage objects query failed at offset ${offset}: ${response.status} ${await readErrorBody(response)}`
      );
    }

    const rows = await response.json();
    for (const row of rows) {
      if (row.name) {
        files.push(row.name);
      }
    }

    console.log(`Scanned storage objects at offset ${offset}, found ${files.length} files so far...`);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return files;
}

async function deleteObject(storagePath) {
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${encodeURIComponent(BUCKET_NAME)}/${encodeObjectPath(storagePath)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete ${storagePath}: ${response.status} ${await readErrorBody(response)}`);
  }
}

async function deleteIconLibraryRows() {
  const response = await fetch(`${baseUrl}/rest/v1/icon_library?id=gt.0`, {
    method: 'DELETE',
    headers: authHeaders({
      Prefer: 'return=minimal',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to clear icon_library rows: ${response.status} ${await readErrorBody(response)}`);
  }
}

async function main() {
  console.log(`Listing files from bucket "${BUCKET_NAME}"...`);
  const files = await listAllFiles();

  if (!files.length) {
    console.log('Bucket is already empty.');
    if (DELETE_ICON_LIBRARY_ROWS) {
      console.log('Clearing icon_library rows...');
      await deleteIconLibraryRows();
    }
    return;
  }

  for (let index = 0; index < files.length; index += 25) {
    const chunk = files.slice(index, index + 25);
    console.log(`Deleting bucket files ${index + 1}-${index + chunk.length} of ${files.length}...`);
    for (const storagePath of chunk) {
      await deleteObject(storagePath);
    }
  }

  if (DELETE_ICON_LIBRARY_ROWS) {
    console.log('Clearing icon_library rows...');
    await deleteIconLibraryRows();
  }

  console.log(
    JSON.stringify(
      {
        bucket: BUCKET_NAME,
        deletedFiles: files.length,
        deletedIconLibraryRows: DELETE_ICON_LIBRARY_ROWS,
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
