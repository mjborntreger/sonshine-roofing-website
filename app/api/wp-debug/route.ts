import { NextResponse } from "next/server";

const ENDPOINT =
  process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ||
  "https://next.sonshineroofing.com/graphql";

async function gq<T>(query: string, variables?: Record<string, any>) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // keep it super-fresh while debugging
    next: { revalidate: 1 },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json;
}

export async function GET() {
  // 1) sanity check
  const meta = await gq(`
    query {
      generalSettings { title url description }
    }
  `);

  // 2) minimal videoEntries query (no ACF fields to avoid schema mismatch)
// /api/wp-debug/route.ts -> replace the "vids" query with:
const vids = await gq(
  `
  query InspectVideos($limit: Int!) {
    videoEntries(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        title
        date
        videoCategories(first: 10) { nodes { name slug } }
        videoLibraryMetadata { youtubeUrl }   # ✅ your ACF group + field
      }
    }
  }
  `,
  { limit: 3 }
);


  // 3) minimal projects query
const projs = await gq(
  `
  query InspectProjects($limit: Int!) {
    projects(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        slug
        title
        date
        projectVideoInfo { youtubeUrl }       # ✅ your ACF group + field
      }
    }
  }
  `,
  { limit: 3 }
)}