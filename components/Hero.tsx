import SmartLink from ".//SmartLink";
import { Button } from "@/components/ui/button";
import { Phone, Hammer, Zap } from "lucide-react"

export default function Hero() {
  return (
    <>
    <section className="relative isolate text-white min-h-[70svh] lg:min-h-[80svh] h-[70svh] lg:h-[80svh]">
      {/* Background video */}
      <video
        className="absolute inset-0 -z-10 h-full w-full object-cover pointer-events-none motion-safe:opacity-100 motion-reduce:hidden"
        src="https://next.sonshineroofing.com/wp-content/uploads/sonshine-roofing-website-background-video-optimized.webm"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        // poster="/fallback.jpg" // optional: add a poster for faster first paint
      />

      {/* Transparent gradient overlay for legibility */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-gradient-to-t from-black/70 via-black/50 to-black/30
        "
      />

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-18">
        <div className="max-w-7xl">
          <h1 className="text-5xl lg:text-8xl font-bold tracking-tight leading-tight text-white lg:mt-20">
            Your Trusted Local Roofing Contractor in Sarasota, Manatee, and Charlotte Counties for 38+ Years
          </h1>

          <p className="mt-5 text-white/90 text-lg md:text-2xl max-w-2xl">
            We prioritize extending the lifespan of your current roof above all else. <br></br> 
            Call us today to find out more.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            
          <Button asChild variant="brandOrange">
            <SmartLink 
              href="https://www.myquickroofquote.com/contractors/sonshine-roofing" 
              aria-label="Get a free 60-second quote"
              className="text-lg flex items-center justify-center gap-x-2 mt-4"
            >
              <Zap className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
              Free 60-Second Quote
            </SmartLink>
          </Button>

          <Button asChild variant="brandBlue">
            <SmartLink 
              href="/project" 
              target="_self"
              className="text-lg hidden md:flex items-center justify-center gap-x-2 mt-4"
            >
              <Hammer className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
              See Projects
            </SmartLink>
          </Button>

          <Button asChild variant="brandBlue">
            <SmartLink 
              href="tel:+19418664320" 
              target="_self"
              className="text-lg flex md:hidden items-center justify-center gap-x-2 mt-4"
            >
              <Phone className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
              Call (941 866-4320)
            </SmartLink>
          </Button>

          </div>
        </div>
      </div>
    </section>
    <div className="h-1.5 w-full bg-gradient-to-r from-[#0045d7] via-[#00e3fe] to-[#0045d7]" />
    </>
  );
}
