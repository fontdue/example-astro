/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // Short-lived preview token for logged-in staff. src/middleware.ts reads
    // it from the preview cookie on each request; pages forward it to GraphQL
    // (via previewAuthHeaders) so staff see unpublished ("hidden") fonts while
    // the public sees only published ones.
    fontduePreviewToken?: string;
  }
}
