import type { APIRoute } from 'astro';
import { getAllPostsAdmin, getAllCategoryGroups, deletePost } from '../../lib/db';
import { AUTH_COOKIE_NAME, isAuthenticated } from '../../lib/auth';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any)?.runtime?.env?.DB;
  const mode = url.searchParams.get('mode');

  if (mode === 'categories') {
    const groups = await getAllCategoryGroups(3, db);
    return new Response(JSON.stringify(groups), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const posts = await getAllPostsAdmin(db);
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, locals, cookies }) => {
  const authCookie = cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!isAuthenticated(authCookie) && token !== 'hollywoodtime_secret_key_2026') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const id = body.id || body.slug;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID or Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = (locals as any)?.runtime?.env?.DB;
    const ok = await deletePost(id, db);
    return new Response(JSON.stringify({ success: ok, message: 'Story deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
