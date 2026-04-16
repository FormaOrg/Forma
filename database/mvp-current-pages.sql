-- FORMA MVP schema for the pages currently implemented in the frontend.
-- Target: PostgreSQL

create table if not exists users (
    id bigserial primary key,
    first_name varchar(50) not null,
    last_name varchar(50) not null,
    username varchar(50) unique,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    phone varchar(20),
    country varchar(100),
    website varchar(255),
    role varchar(20) not null default 'STANDARD',
    is_active boolean not null default true,
    email_verified boolean not null default false,
    last_login_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint chk_users_role
        check (role in ('STANDARD', 'PREMIUM', 'ADMIN'))
);

create table if not exists subscriptions (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    plan_type varchar(20) not null,
    status varchar(20) not null,
    start_date timestamp not null,
    end_date timestamp,
    price_tnd numeric(10, 2) not null default 0,
    auto_renew boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint chk_subscriptions_plan_type
        check (plan_type in ('FREE', 'PREMIUM')),
    constraint chk_subscriptions_status
        check (status in ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'))
);

create index if not exists idx_subscriptions_user_id on subscriptions(user_id);

create table if not exists audit_logs (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    action_type varchar(60) not null,
    description text not null,
    ip_address varchar(64),
    user_agent text,
    resource_type varchar(60),
    resource_id bigint,
    success boolean not null default true,
    error_message text,
    created_at timestamp not null default now()
);

create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);

create table if not exists password_reset_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    token varchar(255) not null unique,
    expires_at timestamp not null,
    used boolean not null default false,
    created_at timestamp not null default now()
);

create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens(user_id);

create table if not exists email_verification_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    token varchar(255) not null unique,
    expires_at timestamp not null,
    used boolean not null default false,
    created_at timestamp not null default now()
);

create index if not exists idx_email_verification_tokens_user_id on email_verification_tokens(user_id);

create table if not exists templates (
    id bigserial primary key,
    name varchar(120) not null,
    category varchar(30) not null,
    description text,
    preview_image_url varchar(255),
    is_premium boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint chk_templates_category
        check (category in ('BUSINESS', 'PORTFOLIO', 'ECOMMERCE', 'BLOG', 'LANDING_PAGE'))
);

create table if not exists projects (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    template_id bigint references templates(id) on delete set null,
    name varchar(120) not null,
    description text,
    type varchar(30) not null,
    creation_method varchar(30) not null,
    status varchar(20) not null default 'DRAFT',
    is_published boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint chk_projects_type
        check (type in ('BUSINESS', 'PORTFOLIO', 'ECOMMERCE', 'BLOG', 'LANDING_PAGE')),
    constraint chk_projects_creation_method
        check (creation_method in ('DRAG_DROP', 'VISUAL_DESIGNER', 'AI_PROMPT', 'HYBRID')),
    constraint chk_projects_status
        check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_template_id on projects(template_id);

create table if not exists project_customers (
    id bigserial primary key,
    project_id bigint not null references projects(id) on delete cascade,
    first_name varchar(120) not null,
    last_name varchar(120) not null,
    email varchar(255),
    phone varchar(40),
    address varchar(255),
    zone_label varchar(120),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index if not exists idx_project_customers_project_id on project_customers(project_id);
create index if not exists idx_project_customers_email on project_customers(email);

create table if not exists project_products (
    id bigserial primary key,
    project_id bigint not null references projects(id) on delete cascade,
    name varchar(140) not null,
    sku varchar(80),
    category varchar(120),
    price numeric(12, 2) not null default 0,
    active boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index if not exists idx_project_products_project_id on project_products(project_id);

create table if not exists project_orders (
    id bigserial primary key,
    project_id bigint not null references projects(id) on delete cascade,
    customer_id bigint references project_customers(id) on delete set null,
    order_number varchar(60) not null,
    placed_at timestamp not null,
    scheduled_for timestamp,
    delivered_at timestamp,
    payment_status varchar(32) not null,
    fulfillment_status varchar(32) not null,
    subtotal numeric(12, 2) not null default 0,
    delivery_fee numeric(12, 2) not null default 0,
    total numeric(12, 2) not null default 0,
    delivery_address varchar(255),
    notes varchar(1000),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint chk_project_orders_payment_status
        check (payment_status in ('DUE_ON_DELIVERY', 'COLLECTED', 'DEPOSIT_TAKEN', 'DEPOSIT_RETURNED')),
    constraint chk_project_orders_fulfillment_status
        check (fulfillment_status in ('NEW', 'PACKING', 'SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'))
);

create index if not exists idx_project_orders_project_id on project_orders(project_id);
create index if not exists idx_project_orders_placed_at on project_orders(placed_at);
create index if not exists idx_project_orders_order_number on project_orders(order_number);

create table if not exists project_order_items (
    id bigserial primary key,
    order_id bigint not null references project_orders(id) on delete cascade,
    product_id bigint references project_products(id) on delete set null,
    product_name varchar(140) not null,
    product_sku varchar(80),
    quantity integer not null,
    unit_price numeric(12, 2) not null default 0,
    line_total numeric(12, 2) not null default 0,
    constraint chk_project_order_items_quantity check (quantity >= 1)
);

create index if not exists idx_project_order_items_order_id on project_order_items(order_id);
create index if not exists idx_project_order_items_product_id on project_order_items(product_id);

create table if not exists project_storefronts (
    id bigserial primary key,
    project_id bigint not null unique references projects(id) on delete cascade,
    store_name varchar(160),
    store_status varchar(20) not null default 'DRAFT',
    theme_key varchar(80),
    active_page_key varchar(80) not null default 'home',
    draft_homepage_json jsonb not null,
    published_homepage_json jsonb,
    published_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint chk_project_storefronts_status
        check (store_status in ('DRAFT', 'PUBLISHED'))
);

create index if not exists idx_project_storefronts_project_id on project_storefronts(project_id);
