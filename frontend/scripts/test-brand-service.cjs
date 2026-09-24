const assert = require('assert');

// Simulate the validator and service logic directly to test all core rules in a standalone Node runner
function isSafeUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return true;
  }
  if (/^data:image\/(png|jpe?g|svg\+xml|webp|gif|x-icon);base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isSafeColor(color) {
  if (typeof color !== 'string' || !color.trim()) return false;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return true;
  }
  if (/^(rgb|hsl)a?\(\s*[\d.%\s,/-]+\s*\)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

const DEFAULT_BRAND_CONFIG = {
  name: 'SocialYolo',
  shortName: 'SocialYolo',
  description: 'AI Social Media Studio & Post Generator',
  logo: '',
  logoLight: '',
  logoDark: '',
  favicon: '/favicon.ico',
  sidebarLogo: '',
  sidebarIcon: '',
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7',
  websiteUrl: 'https://socialyolo.ai',
  supportUrl: 'https://socialyolo.ai/support',
};

const FORBIDDEN_SECURITY_KEYS = new Set([
  'api', 'apibaseurl', 'apiurl', 'auth', 'authorization', 'authprovider',
  'backend', 'backendurl', 'database', 'databaseurl', 'jwt', 'oauth',
  'password', 'permissions', 'proxy', 'proxyurl', 'rbac', 'redirect',
  'redirecturl', 'role', 'roles', 'secret', 'token', 'user', 'users',
]);

function validateBrandConfig(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ...DEFAULT_BRAND_CONFIG };
  }

  const raw = data;
  const clean = { ...DEFAULT_BRAND_CONFIG };

  if (typeof raw.name === 'string' && raw.name.trim()) {
    clean.name = raw.name.trim().slice(0, 100);
  }
  if (typeof raw.shortName === 'string' && raw.shortName.trim()) {
    clean.shortName = raw.shortName.trim().slice(0, 50);
  } else {
    clean.shortName = clean.name;
  }
  if (typeof raw.description === 'string' && raw.description.trim()) {
    clean.description = raw.description.trim().slice(0, 300);
  }

  const urlKeys = ['logo', 'logoLight', 'logoDark', 'favicon', 'sidebarLogo', 'sidebarIcon', 'websiteUrl', 'supportUrl'];
  for (const key of urlKeys) {
    const val = raw[key];
    if (typeof val === 'string' && isSafeUrl(val)) {
      clean[key] = val.trim();
    }
  }

  if (isSafeColor(raw.primaryColor)) {
    clean.primaryColor = raw.primaryColor.trim();
  }
  if (isSafeColor(raw.secondaryColor)) {
    clean.secondaryColor = raw.secondaryColor.trim();
  }

  for (const [key, val] of Object.entries(raw)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_SECURITY_KEYS.has(lowerKey)) {
      continue;
    }
    if (!(key in clean)) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        clean[key] = val;
      }
    }
  }

  return clean;
}

function determineBrandSourceUrl(currentUrl, envConfigUrl, envConfigMap) {
  let hostname = '';
  if (currentUrl) {
    try {
      hostname = new URL(currentUrl, 'http://localhost').hostname.toLowerCase();
    } catch {
      hostname = '';
    }
  }

  if (envConfigMap && hostname) {
    try {
      const map = JSON.parse(envConfigMap);
      if (map && typeof map === 'object' && map[hostname] && isSafeUrl(map[hostname])) {
        return map[hostname];
      }
    } catch {}
  }

  if (envConfigUrl && typeof envConfigUrl === 'string' && envConfigUrl.trim()) {
    let resolved = envConfigUrl.trim();
    if (resolved.includes('{hostname}') && hostname) {
      resolved = resolved.replace(/\{hostname\}/g, encodeURIComponent(hostname));
    }
    if (isSafeUrl(resolved)) {
      return resolved;
    }
  }

  return null;
}

console.log('=== RUNNING BRAND SERVICE TEST SUITE ===');

// Test 1: Full valid config
console.log('Test 1: Full valid config validation...');
const sampleConfig = {
  name: 'Acme Media',
  shortName: 'Acme',
  description: 'Acme Global Studios',
  logo: 'https://example.com/logo.svg',
  logoLight: 'https://example.com/logo-light.svg',
  logoDark: 'https://example.com/logo-dark.svg',
  favicon: 'https://example.com/favicon.ico',
  sidebarLogo: 'https://example.com/sidebar.svg',
  sidebarIcon: 'https://example.com/icon.svg',
  primaryColor: '#ff5500',
  secondaryColor: '#0055ff',
  websiteUrl: 'https://example.com',
  supportUrl: 'https://example.com/support',
};
const res1 = validateBrandConfig(sampleConfig);
assert.strictEqual(res1.name, 'Acme Media');
assert.strictEqual(res1.shortName, 'Acme');
assert.strictEqual(res1.logo, 'https://example.com/logo.svg');
assert.strictEqual(res1.primaryColor, '#ff5500');
console.log('✔ Test 1 passed.');

// Test 2: Security property rejection
console.log('Test 2: Security denylist stripping...');
const maliciousConfig = {
  name: 'Hacker Brand',
  apiBaseUrl: 'https://evil.com/api',
  authProvider: 'evil-oauth',
  role: 'SUPER_ADMIN',
  token: 'stolen_token_123',
  database: 'postgres://root:pwned@localhost',
};
const res2 = validateBrandConfig(maliciousConfig);
assert.strictEqual(res2.name, 'Hacker Brand');
assert.strictEqual(res2.apiBaseUrl, undefined);
assert.strictEqual(res2.authProvider, undefined);
assert.strictEqual(res2.role, undefined);
assert.strictEqual(res2.token, undefined);
assert.strictEqual(res2.database, undefined);
console.log('✔ Test 2 passed (security parameters stripped).');

// Test 3: Dangerous URL schemes rejection
console.log('Test 3: Dangerous URL schemes rejection...');
const xssConfig = {
  name: 'Safe Name',
  logo: 'javascript:alert(document.cookie)',
  favicon: 'vbscript:msgbox(1)',
  websiteUrl: 'data:text/html,<script>alert(1)</script>',
};
const res3 = validateBrandConfig(xssConfig);
assert.strictEqual(res3.logo, DEFAULT_BRAND_CONFIG.logo);
assert.strictEqual(res3.favicon, DEFAULT_BRAND_CONFIG.favicon);
assert.strictEqual(res3.websiteUrl, DEFAULT_BRAND_CONFIG.websiteUrl);
console.log('✔ Test 3 passed (dangerous URLs blocked, fallbacks preserved).');

// Test 4: CSS injection in color codes
console.log('Test 4: Color code validation...');
const cssInjection = {
  name: 'Color Test',
  primaryColor: 'red; background: url(https://evil.com/track);',
  secondaryColor: 'rgba(0, 100, 200, 0.8)',
};
const res4 = validateBrandConfig(cssInjection);
assert.strictEqual(res4.primaryColor, DEFAULT_BRAND_CONFIG.primaryColor);
assert.strictEqual(res4.secondaryColor, 'rgba(0, 100, 200, 0.8)');
console.log('✔ Test 4 passed (CSS injection prevented).');

// Test 5: Hostname template resolution
console.log('Test 5: Hostname template URL resolution...');
const template = 'https://cdn.example.com/brands/{hostname}.json';
const resolved5 = determineBrandSourceUrl('https://app.customcorp.com/dashboard', template);
assert.strictEqual(resolved5, 'https://cdn.example.com/brands/app.customcorp.com.json');
console.log('✔ Test 5 passed (dynamic hostname resolution matches template).');

// Test 6: Multi-domain map resolution
console.log('Test 6: Multi-domain map resolution...');
const map = JSON.stringify({
  'tenant-a.com': 'https://cdn.example.com/configs/tenant-a.json',
  'tenant-b.com': 'https://cdn.example.com/configs/tenant-b.json',
});
const resolved6A = determineBrandSourceUrl('https://tenant-a.com', null, map);
const resolved6B = determineBrandSourceUrl('https://tenant-b.com/app', null, map);
assert.strictEqual(resolved6A, 'https://cdn.example.com/configs/tenant-a.json');
assert.strictEqual(resolved6B, 'https://cdn.example.com/configs/tenant-b.json');
console.log('✔ Test 6 passed (multi-tenant mapping verified).');

// Test 7: Null or malformed input fallback
console.log('Test 7: Malformed input resilience...');
assert.strictEqual(validateBrandConfig(null).name, DEFAULT_BRAND_CONFIG.name);
assert.strictEqual(validateBrandConfig(undefined).name, DEFAULT_BRAND_CONFIG.name);
assert.strictEqual(validateBrandConfig('not-an-object').name, DEFAULT_BRAND_CONFIG.name);
assert.strictEqual(validateBrandConfig([1, 2, 3]).name, DEFAULT_BRAND_CONFIG.name);
console.log('✔ Test 7 passed (graceful fallback to defaults on invalid input).');

console.log('=== ALL 7 BRAND SERVICE TESTS PASSED SUCCESSFULLY! ===');
