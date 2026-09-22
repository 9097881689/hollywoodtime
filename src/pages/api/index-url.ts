import type { APIRoute } from 'astro';
import { submitToGoogleIndexing } from '../../lib/google-indexing';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, serviceAccountJson } = body;

    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await submitToGoogleIndexing(url, serviceAccountJson);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
