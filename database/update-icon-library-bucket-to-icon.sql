update public.icon_library
set public_url = regexp_replace(
    public_url,
    '/storage/v1/object/public/icons/',
    '/storage/v1/object/public/icon/'
)
where public_url like '%/storage/v1/object/public/icons/%';
