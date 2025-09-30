import ResourcesQuickLinks from "./ResourcesQuickLinks"
import SidebarCta from "./SidebarCta";

export default async function ResourcesAside() {
    return (
        <aside className="sticky top-16">
            <ResourcesQuickLinks />
            <SidebarCta />
        </aside>
    )
}