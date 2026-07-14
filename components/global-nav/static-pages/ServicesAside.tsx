import SidebarCta from "@/components/cta/SidebarCta";
import ServicesQuickLinks from "@/components/global-nav/static-pages/ServicesQuickLinks";
import { getServices } from "@/lib/content/directus-site";


export type ServicesAsideProps = {
    activePath?: string;
};

export default async function ServicesAside({ activePath = "/" }: ServicesAsideProps) {
    const services = await getServices();

    return (
        <aside className="sticky top-16 self-start h-fit lg:w-[320px]">
            <ServicesQuickLinks activePath={activePath} services={services} />
            <div className="h-[1px] w-full bg-blue-100 my-4" />
            <SidebarCta />
        </aside>
    )
}
