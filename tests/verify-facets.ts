import assert from "node:assert/strict";

import { listPostsPaged, listVideoItemsPaged } from "../lib/wp";

type FetchStub = typeof fetch;

const BLOG_RESPONSE = {
  data: {
    posts: {
      nodes: [],
      pageInfo: { offsetPagination: { total: 102, hasMore: false } },
    },
    facetCounts: {
      total: 102,
      facets: [
        {
          taxonomy: "category",
          buckets: [
            { slug: "news", name: "News", count: 3 },
            { slug: "tips", name: "Tips", count: 2 },
          ],
        },
      ],
    },
  },
};

const VIDEO_ENTRIES_RESPONSE = {
  data: {
    videoEntries: {
      nodes: [
        {
          id: "vid-entry-1",
          slug: "entry-acc",
          title: "Accolade Entry",
          date: "2024-01-01T00:00:00Z",
          videoCategories: {
            nodes: [
              { name: "Awards", slug: "Awards" },
            ],
          },
          videoLibraryMetadata: {
            youtubeUrl: "https://youtu.be/entryAcc",
            description: "Entry description",
            materialType: null,
            serviceArea: null,
          },
        },
        {
          id: "vid-entry-2",
          slug: "entry-exp",
          title: "Explainer Entry",
          date: "2024-01-02T00:00:00Z",
          videoCategories: {
            nodes: [
              { name: "How-To", slug: "Explainer" },
            ],
          },
          videoLibraryMetadata: {
            youtubeUrl: "https://youtu.be/entryExp",
            description: "Explainer description",
            materialType: null,
            serviceArea: null,
          },
        },
      ],
    },
  },
};

const VIDEO_PROJECTS_RESPONSE = {
  data: {
    projects: {
      nodes: [
        {
          slug: "project-metal",
          title: "Metal Roof Project",
          date: "2024-02-01T00:00:00Z",
          projectVideoInfo: { youtubeUrl: "https://youtu.be/projectMetal" },
          projectDetails: { projectDescription: "Project description" },
          projectFilters: {
            materialType: {
              nodes: [
                { name: "Metal", slug: "Metal" },
              ],
            },
            serviceArea: {
              nodes: [
                { name: "Sarasota", slug: "Sarasota" },
              ],
            },
          },
        },
      ],
    },
  },
};

async function withStubFetch<T>(stub: FetchStub, run: () => Promise<T>): Promise<T> {
  const originalFetch = global.fetch;
  global.fetch = stub;
  try {
    return await run();
  } finally {
    global.fetch = originalFetch;
  }
}

async function verifyBlogFacets() {
  await withStubFetch(
    (async (_input, init) => {
      const body = JSON.parse((init as RequestInit)?.body?.toString() ?? "{}");
      if (typeof body.query === "string" && body.query.includes("BlogArchive")) {
        return new Response(JSON.stringify(BLOG_RESPONSE), { status: 200 });
      }
      throw new Error("Unexpected query in blog facet verification");
    }) as FetchStub,
    async () => {
      const result = await listPostsPaged({ first: 6, after: null, filters: {} });
      assert.equal(result.facets.length, 1);
      const categoryFacet = result.facets[0];
      assert.equal(categoryFacet.taxonomy, "category");
      assert.deepEqual(categoryFacet.buckets, [
        { slug: "news", name: "News", count: 3 },
        { slug: "tips", name: "Tips", count: 2 },
      ]);
      assert.equal(result.meta?.overallTotal, 102);
    }
  );
  console.log("✓ Blog facet bucket mapping verified");
}

async function verifyVideoFacets() {
  await withStubFetch(
    (async (_input, init) => {
      const body = JSON.parse((init as RequestInit)?.body?.toString() ?? "{}");
      if (typeof body.query === "string" && body.query.includes("ListVideoEntries")) {
        return new Response(JSON.stringify(VIDEO_ENTRIES_RESPONSE), { status: 200 });
      }
      if (typeof body.query === "string" && body.query.includes("ListProjectVideos")) {
        return new Response(JSON.stringify(VIDEO_PROJECTS_RESPONSE), { status: 200 });
      }
      throw new Error("Unexpected query in video facet verification");
    }) as FetchStub,
    async () => {
      const result = await listVideoItemsPaged({
        first: 8,
        after: null,
        filters: {
          materialTypeSlugs: ["METAL", "metal-roof"],
          serviceAreaSlugs: ["SARASOTA"],
        },
      });

      const bucketFacet = result.facets.find((facet) => facet.taxonomy === "bucket");
      assert(bucketFacet, "bucket facet missing");
      const bucketSlugs = bucketFacet!.buckets.map((bucket) => bucket.slug);
      assert(bucketSlugs.includes("accolades"), "accolades bucket missing");
      assert(bucketSlugs.every((slug) => slug === slug.toLowerCase()), "bucket slugs should be lowercase");

      const materialFacet = result.facets.find((facet) => facet.taxonomy === "material_type");
      assert(materialFacet, "material facet missing");
      const materialMap = new Map(materialFacet!.buckets.map((bucket) => [bucket.slug, bucket.count]));
      assert.equal(materialMap.get("metal"), 1);
      assert.equal(materialMap.get("metal-roof"), 0);

      const serviceFacet = result.facets.find((facet) => facet.taxonomy === "service_area");
      assert(serviceFacet, "service facet missing");
      const serviceMap = new Map(serviceFacet!.buckets.map((bucket) => [bucket.slug, bucket.count]));
      assert.equal(serviceMap.get("sarasota"), 1);
    }
  );
  console.log("✓ Video facet normalization verified");
}

async function main() {
  await verifyBlogFacets();
  await verifyVideoFacets();
  console.log("All facet verifications passed.");
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("Non-error thrown:", JSON.stringify(error));
  }
  process.exit(1);
});
