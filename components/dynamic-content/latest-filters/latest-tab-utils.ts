import type { ProjectSummary, PostCard } from "@/lib/content/wp";
import type { CategoryKey, MaterialKey, TabConfig } from "./latest-tab-config";
import { PROJECT_TAB_CONFIG, POST_TAB_CONFIG } from "./latest-tab-config";

type TabRecord<Key extends string, Value> = Record<Key, Value>;

function initTabRecord<Key extends string, Value>(
  configs: Array<TabConfig<Key>>,
  factory: () => Value,
): TabRecord<Key, Value> {
  return configs.reduce((acc, tab) => {
    acc[tab.key] = factory();
    return acc;
  }, {} as TabRecord<Key, Value>);
}

export function groupProjectsByMaterial(projects: ProjectSummary[]): TabRecord<MaterialKey, ProjectSummary[]> {
  const groups = initTabRecord(PROJECT_TAB_CONFIG, () => [] as ProjectSummary[]);

  for (const project of Array.isArray(projects) ? projects : []) {
    const materialSlugs = (project.materialTypes ?? [])
      .map((term) => (term?.slug ?? "").toLowerCase())
      .filter(Boolean);

    if (materialSlugs.includes("tile")) groups.tile.push(project);
    if (materialSlugs.includes("shingle")) groups.shingle.push(project);
    if (materialSlugs.includes("metal")) groups.metal.push(project);
  }

  return groups;
}

export function groupPostsByCategory(posts: PostCard[]): TabRecord<CategoryKey, PostCard[]> {
  const groups = initTabRecord(POST_TAB_CONFIG, () => [] as PostCard[]);

  for (const post of Array.isArray(posts) ? posts : []) {
    const slugs = (post.categoryTerms ?? [])
      .map((term) => term?.slug?.toLowerCase() ?? "")
      .filter(Boolean);

    if (slugs.includes("education")) groups.education.push(post);
    if (slugs.includes("hurricane-preparation")) groups["hurricane-preparation"].push(post);
    if (slugs.includes("energy-efficient-roofing")) groups["energy-efficient-roofing"].push(post);
  }

  return groups;
}

export function orderTabs<Key extends string>(configs: Array<TabConfig<Key>>): Key[] {
  return configs.map((tab) => tab.key);
}
