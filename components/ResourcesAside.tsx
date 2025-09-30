import ResourcesQuickLinks from "./ResourcesQuickLinks"
import SidebarCta from "./SidebarCTA";

export default async function ResourcesAside() {
    return (
        <aside className="sticky top-24">
            <ResourcesQuickLinks />
            <SidebarCta />
        </aside>
    )
}