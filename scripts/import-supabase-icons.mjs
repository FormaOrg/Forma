const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_ICONS_BUCKET || 'icon';
const PAGE_SIZE = Number(process.env.SUPABASE_ICONS_PAGE_SIZE || 1000);

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

async function listAllFiles() {
  const files = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const response = await fetch(
      `${baseUrl}/rest/v1/objects?select=name&bucket_id=eq.${encodeURIComponent(BUCKET_NAME)}&name=like.*.svg&order=name.asc`,
      {
        headers: {
          ...authHeaders({
            Range: `${from}-${to}`,
            Prefer: 'count=exact',
            'Accept-Profile': 'storage',
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Storage objects query failed at range ${from}-${to}: ${response.status} ${await response.text()}`);
    }

    const rows = await response.json();
    for (const row of rows) {
      if (row.name && row.name.toLowerCase().endsWith('.svg')) {
        files.push(row.name);
      }
    }

    console.log(`Scanned storage objects rows ${from}-${to}, found ${files.length} SVGs so far...`);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return files;
}

async function fetchExistingStoragePaths() {
  const existing = new Set();
  let from = 0;

  while (true) {
    const to = from + 999;
    const response = await fetch(
      `${baseUrl}/rest/v1/icon_library?select=storage_path`,
      {
        headers: authHeaders({
          Range: `${from}-${to}`,
          Prefer: 'count=exact',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to read existing icon_library rows: ${response.status} ${await response.text()}`);
    }

    const rows = await response.json();
    for (const row of rows) {
      if (row.storage_path) {
        existing.add(row.storage_path);
      }
    }

    if (rows.length < 1000) {
      break;
    }

    from += 1000;
  }

  return existing;
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

async function insertRows(rows) {
  if (!rows.length) {
    return;
  }

  const response = await fetch(`${baseUrl}/rest/v1/icon_library`, {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`Insert failed: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  console.log(`Scanning bucket "${BUCKET_NAME}" via storage.objects...`);
  const files = unique(await listAllFiles());
  console.log(`Found ${files.length} SVG files in storage.`);
  const existingStoragePaths = await fetchExistingStoragePaths();
  const newRows = files
    .filter((storagePath) => !existingStoragePaths.has(storagePath))
    .map(buildIconRow);

  for (let index = 0; index < newRows.length; index += 100) {
    const end = Math.min(index + 100, newRows.length);
    console.log(`Inserting rows ${index + 1}-${end} of ${newRows.length}...`);
    await insertRows(newRows.slice(index, index + 100));
  }

  console.log(JSON.stringify({
    bucket: BUCKET_NAME,
    discovered: files.length,
    inserted: newRows.length,
    skipped: files.length - newRows.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
