import ResourcesQuickLinks from "./ResourcesQuickLinks"
import SidebarCta from "./SidebarCta";

export type ResourcesAsideProps = {
    activePath?: string;
};

export default function ResourcesAside({ activePath = "/" }: ResourcesAsideProps) {
    return (
        <aside className="sticky top-16">
            <ResourcesQuickLinks activePath={activePath} />
            <SidebarCta />
        </aside>
    )
}
