import type { APIRoute } from 'astro';
import { getAllPosts, getAllCategoryGroups } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const mode = url.searchParams.get('mode');

  if (mode === 'categories') {
    const groups = await getAllCategoryGroups(3);
    return new Response(JSON.stringify(groups), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const posts = await getAllPosts();
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
};
