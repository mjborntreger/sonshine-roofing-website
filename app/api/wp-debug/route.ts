import { NextResponse } from "next/server";

const ENDPOINT =
  process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ||
  "https://next.sonshineroofing.com/graphql";

type GraphQLVariables = Record<string, unknown>;

type GraphQLError = { message?: string } & Record<string, unknown>;

type GraphQLBody<T> = {
  data?: T;
  errors?: GraphQLError[] | null;
};

type GraphQLResult<T> = {
  status: number;
  body: GraphQLBody<T>;
};

async function gq<T>(query: string, variables?: GraphQLVariables): Promise<GraphQLResult<T>> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 1 },
    cache: "no-store",
    body: JSON.stringify({ query, variables }),
  });

  let body: GraphQLBody<T>;
  try {
    body = (await res.json()) as GraphQLBody<T>;
  } catch {
    body = { errors: [{ message: "Invalid JSON response from WPGraphQL" }] };
  }

  return { status: res.status, body };
}

const META_QUERY = /* GraphQL */ `
  query InspectMeta {
    generalSettings { title url description }
  }
`;

const VIDEOS_QUERY = /* GraphQL */ `
  query InspectVideos($limit: Int!) {
    videoEntries(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        title
        date
        videoCategories(first: 10) { nodes { name slug } }
        videoLibraryMetadata { youtubeUrl }
      }
    }
  }
`;

const PROJECTS_QUERY = /* GraphQL */ `
  query InspectProjects($limit: Int!) {
    projects(first: $limit, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        slug
        title
        date
        projectVideoInfo { youtubeUrl }
      }
    }
  }
`;

export async function GET() {
  try {
    const [meta, videos, projects] = await Promise.all([
      gq<{ generalSettings?: { title?: string; url?: string; description?: string } }>(META_QUERY),
      gq<{ videoEntries?: { nodes: unknown[] } }>(VIDEOS_QUERY, { limit: 3 }),
      gq<{ projects?: { nodes: unknown[] } }>(PROJECTS_QUERY, { limit: 3 }),
    ]);

    return NextResponse.json(
      { meta, videos, projects },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
