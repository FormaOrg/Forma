import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    __FORMA_RUNTIME_CONFIG__?: {
      apiUrl?: string;
      wsBaseUrl?: string;
    };
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const LOCAL_API_URL = 'http://localhost:8081/api';
const PRODUCTION_API_URL = 'https://forma-production-c40b.up.railway.app/api';

function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveRuntimeApiUrl(): string {
  if (typeof window === 'undefined' || !window.location) {
    return environment.apiUrl;
  }

  const configuredApiUrl = window.__FORMA_RUNTIME_CONFIG__?.apiUrl;
  if (hasText(configuredApiUrl)) {
    return configuredApiUrl.trim();
  }

  const host = window.location.hostname.trim().toLowerCase();
  return LOCAL_HOSTS.has(host) ? LOCAL_API_URL : PRODUCTION_API_URL;
}

export function getApiUrl(): string {
  return trimTrailingSlashes(resolveRuntimeApiUrl());
}

export function getAuthApiUrl(): string {
  return `${getApiUrl()}/auth`;
}

export function getUsersApiUrl(): string {
  return `${getApiUrl()}/users`;
}

export function getWebSocketUrl(channel: string): string {
  const normalizedChannel = channel.trim().replace(/^\/+/, '');
  const configuredWsBaseUrl = typeof window !== 'undefined'
    ? window.__FORMA_RUNTIME_CONFIG__?.wsBaseUrl
    : undefined;

  if (hasText(configuredWsBaseUrl)) {
    return `${trimTrailingSlashes(configuredWsBaseUrl.trim())}/${normalizedChannel}`;
  }

  try {
    const apiUrl = new URL(getApiUrl());
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiPath = apiUrl.pathname.replace(/\/+$/, '');
    const basePath = apiPath.endsWith('/api') ? apiPath.slice(0, -4) : apiPath;
    return `${protocol}//${apiUrl.host}${basePath}/ws/${normalizedChannel}`;
  } catch {
    return `ws://localhost:8081/ws/${normalizedChannel}`;
  }
}
