import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();

function loadEnvFile(filename) {
  const path = resolve(rootDir, filename);
  if (!existsSync(path)) return;

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    if (process.env[key] !== undefined) continue;

    let value = line.slice(separator + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const directusUrl = (process.env.DIRECTUS_URL ?? "").trim().replace(/\/+$/u, "");
const directusToken = (
  process.env.DIRECTUS_TOKEN ??
  process.env.DIRECTUS_STATIC_TOKEN ??
  ""
).trim();
const clientSlug = (process.env.DIRECTUS_CLIENT_SLUG ?? "").trim();

if (!directusUrl || !directusToken || !clientSlug) {
  throw new Error(
    "[route-manifest] DIRECTUS_URL, DIRECTUS_CLIENT_SLUG, and DIRECTUS_TOKEN or DIRECTUS_STATIC_TOKEN are required.",
  );
}

function normalizePath(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const path = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
  return path.length > 1 ? path.replace(/\/+$/u, "") : "/";
}

function normalizeSlug(value, owner) {
  const slug = String(value ?? "").trim().replace(/^\/+|\/+$/gu, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
    throw new Error(
      '[route-manifest] ' + owner + ' has invalid route slug "' + slug + '".',
    );
  }
  return slug;
}

async function readCollection(collection, fields) {
  const url = new URL("/items/" + collection, directusUrl);
  url.searchParams.set("fields", fields.join(","));
  url.searchParams.set(
    "filter",
    JSON.stringify({
      _and: [
        { client: { slug: { _eq: clientSlug } } },
        { status: { _eq: "published" } },
      ],
    }),
  );
  url.searchParams.set("limit", "500");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + directusToken,
    },
  });

  if (!response.ok) {
    throw new Error(
      "[route-manifest] Directus " +
        collection +
        " request failed with HTTP " +
        response.status +
        ".",
    );
  }

  const payload = await response.json();
  if (!Array.isArray(payload.data)) {
    throw new Error(
      "[route-manifest] Directus " + collection + " returned an invalid payload.",
    );
  }
  return payload.data;
}

const owners = [];

function addOwner(collection, id, path, scopeKey) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    throw new Error(
      "[route-manifest] " + collection + " " + id + " has no route.",
    );
  }
  const expectedScopePrefix = clientSlug + ":";
  if (
    typeof scopeKey !== "string" ||
    !scopeKey.startsWith(expectedScopePrefix)
  ) {
    throw new Error(
      "[route-manifest] " +
        collection +
        " " +
        id +
        " is missing its database-maintained scope_key.",
    );
  }
  owners.push({ collection, id: String(id), path: normalizedPath });
}

const websitePages = await readCollection("website_pages", [
  "id",
  "path",
  "page_type",
  "scope_key",
]);
for (const page of websitePages) {
  addOwner("website_pages", page.id, page.path, page.scope_key);
}

if (
  [
    "borntreger-digital",
    "southern-standards-landscaping",
    "vowell-construction",
    "care-compass-advisors",
    "sonshine-roofing",
  ].includes(clientSlug)
) {
  const services = await readCollection("services", [
    "id",
    "slug",
    "scope_key",
  ]);
  for (const service of services) {
    const slug = normalizeSlug(service.slug, "services " + service.id);
    addOwner(
      "services",
      service.id,
      clientSlug === "sonshine-roofing" ? "/" + slug : "/services/" + slug,
      service.scope_key,
    );
  }
}

if (clientSlug === "borntreger-digital" || clientSlug === "sonshine-roofing") {
  const blogPosts = await readCollection("blog_posts", [
    "id",
    "slug",
    "scope_key",
  ]);
  for (const post of blogPosts) {
    const slug = normalizeSlug(post.slug, "blog_posts " + post.id);
    addOwner(
      "blog_posts",
      post.id,
      clientSlug === "sonshine-roofing" ? "/" + slug : "/blog/" + slug,
      post.scope_key,
    );
  }
}

if (clientSlug === "borntreger-digital") {
  const caseStudies = await readCollection("case_studies", [
    "id",
    "slug",
    "scope_key",
  ]);
  for (const study of caseStudies) {
    const slug = normalizeSlug(study.slug, "case_studies " + study.id);
    addOwner("case_studies", study.id, "/case-studies/" + slug, study.scope_key);
  }
}

if (clientSlug === "sonshine-roofing") {
  const [offers, persons] = await Promise.all([
    readCollection("special_offers", ["id", "slug", "scope_key"]),
    readCollection("persons", ["id", "slug", "scope_key"]),
  ]);
  for (const offer of offers) {
    const slug = normalizeSlug(offer.slug, "special_offers " + offer.id);
    addOwner("special_offers", offer.id, "/special-offers/" + slug, offer.scope_key);
  }
  for (const person of persons) {
    const slug = normalizeSlug(person.slug, "persons " + person.id);
    addOwner("persons", person.id, "/person/" + slug, person.scope_key);
  }
}

const byPath = new Map();
for (const owner of owners) {
  const list = byPath.get(owner.path) ?? [];
  list.push(owner);
  byPath.set(owner.path, list);
}

const collisions = [...byPath.entries()].filter(([, entries]) => entries.length > 1);
if (collisions.length) {
  const details = collisions
    .map(
      ([path, entries]) =>
        path +
        " -> " +
        entries.map((entry) => entry.collection + ":" + entry.id).join(", "),
    )
    .join("\n");
  throw new Error("[route-manifest] Route ownership collision(s):\n" + details);
}

process.stdout.write(
  "[route-manifest] Validated " +
    owners.length +
    " published Directus route owner(s) for " +
    clientSlug +
    ".\n",
);
