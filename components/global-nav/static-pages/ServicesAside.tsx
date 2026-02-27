import SidebarCta from "@/components/cta/SidebarCta";
import ServicesQuickLinks from "@/components/global-nav/static-pages/ServicesQuickLinks";


export type ServicesAsideProps = {
    activePath?: string;
};

export default function ServicesAside({ activePath = "/" }: ServicesAsideProps) {
    return (
        <aside className="sticky top-16 self-start h-fit lg:w-[320px]">
            <ServicesQuickLinks activePath={activePath} />
            <div className="h-[1px] w-full bg-blue-100 my-4" />
            <SidebarCta />
        </aside>
    )
}
