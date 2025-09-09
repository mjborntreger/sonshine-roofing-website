import SmartLink from "./SmartLink";
import BlurText from "./BlurText";
import { Card } from "./ui/card";
import { House, ChevronRight, Wrench, Search, ShieldCheck} from "lucide-react";

const tile = "group card rounded-2xl p-0 transition duration-300 ease-out hover:shadow-lg";
const serviceLink = "grid w-full grid-cols-[auto,1fr,auto] items-center gap-4 p-4 rounded-2xl min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-cyan)] focus-visible:ring-offset-2";
const iconChip = "brand-gradient-bg rounded-full p-2 text-white shadow-sm shrink-0";
const label = "font-semibold text-base md:text-lg text-slate-900";
const caption = "text-slate-500 text-sm leading-snug";
const chevron = "h-5 w-5 shrink-0 text-slate-400 transition duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--brand-blue)]";
const pStyles = "my-8 text-center justify-center text-lg"

export default function RoofingServices() {
    return (
      <div className="my-12">
        <div className="text-center">
          <h2>Roofing Services</h2>
          <div className="gradient-divider my-4" />
          <BlurText
            text="Repair, replacement, and yearly maintenance plans to extend your roof’s lifespan."
            delay={75}
            animateBy="words"
            direction="top"
            className={pStyles}
        />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 items-stretch auto-rows-fr sticky">
          {/* Roof Replacement */}
          <Card className={tile}>
            <SmartLink href="/roof-replacement-sarasota-fl" className={serviceLink} title="Roof Replacement">
              <span className={iconChip}>
                <House className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className={label}>Roof Replacement</span>
                <span className={caption}>Full system installs</span>
              </span>
              <ChevronRight className={chevron} aria-hidden="true" />
            </SmartLink>
          </Card>

          {/* Roof Repair */}
          <Card className={tile}>
            <SmartLink href="/roof-repair" className={serviceLink} title="Roof Repair">
              <span className={iconChip}>
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className={label}>Roof Repair</span>
                <span className={caption}>Leaks, storm damage, flashing</span>
              </span>
              <ChevronRight className={chevron} aria-hidden="true" />
            </SmartLink>
          </Card>

          {/* Roof Inspection */}
          <Card className={tile}>
            <SmartLink href="/roof-inspection" className={serviceLink} title="Roof Inspection">
              <span className={iconChip}>
                <Search className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className={label}>Roof Inspection</span>
                <span className={caption}>Diagnostics & reports</span>
              </span>
              <ChevronRight className={chevron} aria-hidden="true" />
            </SmartLink>
          </Card>

          {/* Roof Maintenance */}
          <Card className={tile}>
            <SmartLink href="/roof-maintenance" className={serviceLink} title="Roof Maintenance">
              <span className={iconChip}>
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className={label}>Roof Maintenance</span>
                <span className={caption}>Join our Roof Care Club (and save big)</span>
              </span>
              <ChevronRight className={chevron} aria-hidden="true" />
            </SmartLink>
          </Card>
        </div>
      </div>
    )
}