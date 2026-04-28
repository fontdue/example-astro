import { defineMiddleware } from 'astro:middleware';
import { configure } from 'fontdue-js';

configure({ url: import.meta.env.PUBLIC_FONTDUE_URL });

export const onRequest = defineMiddleware((_context, next) => next());
