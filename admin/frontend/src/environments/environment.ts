export const environment = {
  production: false,
  // Base URL untuk backend admin Rust. Ubah saat deploy.
  adminApiBaseUrl:
    (globalThis as any).ADMIN_API_BASE_URL ?? 'http://localhost:5000',
};
