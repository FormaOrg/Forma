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
