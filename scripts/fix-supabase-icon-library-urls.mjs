const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_ICONS_BUCKET || 'icon';
const PAGE_SIZE = Math.max(1, Number.parseInt(process.env.SUPABASE_ICONS_PAGE_SIZE || '1000', 10) || 1000);

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

function buildPublicUrl(storagePath) {
  return `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
}

async function fetchIconLibraryRows() {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const response = await fetch(
      `${baseUrl}/rest/v1/icon_library?select=id,storage_path,public_url`,
      {
        headers: authHeaders({
          Range: `${from}-${to}`,
          Prefer: 'count=exact',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to read icon_library rows ${from}-${to}: ${response.status} ${await readErrorBody(response)}`);
    }

    const chunk = await response.json();
    rows.push(...chunk);

    console.log(`Scanned icon_library rows ${from}-${to}, found ${rows.length} rows so far...`);

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

async function upsertRows(rows) {
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
    throw new Error(`Failed to update icon_library rows: ${response.status} ${await readErrorBody(response)}`);
  }
}

async function main() {
  console.log('Scanning icon_library for stale bucket URLs...');
  const rows = await fetchIconLibraryRows();
  const updates = rows
    .filter((row) => row?.id && row?.storage_path)
    .map((row) => {
      const publicUrl = buildPublicUrl(row.storage_path);
      return {
        id: row.id,
        storage_path: row.storage_path,
        public_url: publicUrl,
        needsUpdate: publicUrl !== row.public_url,
      };
    })
    .filter((row) => row.needsUpdate)
    .map(({ needsUpdate, ...row }) => row);

  if (!updates.length) {
    console.log('All icon_library public_url values already point to the correct bucket.');
    return;
  }

  for (let index = 0; index < updates.length; index += 500) {
    const chunk = updates.slice(index, index + 500);
    console.log(`Updating icon_library rows ${index + 1}-${index + chunk.length} of ${updates.length}...`);
    await upsertRows(chunk);
  }

  console.log(JSON.stringify({
    bucket: BUCKET_NAME,
    scannedRows: rows.length,
    updatedRows: updates.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
