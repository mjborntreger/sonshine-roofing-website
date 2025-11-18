"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Phone } from "lucide-react";
import ShinyText from "./ShinyText";
import { scrollToAnchor } from "@/lib/ui/scroll-to-anchor";

type HeroProps = {
  title?: string
};

export default function Hero({ title = "The Best Roofing Company in Sarasota, Manatee, and Charlotte Counties for Over 38 Years" }: HeroProps) {
  return (
    <>
      <section
        className="relative h-auto overflow-hidden text-white isolate">
        {/* Background video */}
        <video
          className="absolute inset-0 object-cover w-full h-full pointer-events-none -z-10"
          src="https://next.sonshineroofing.com/wp-content/uploads/HarborProfessionalCenter3-ezgif.com-gif-maker-1.webm"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        // poster="/fallback.jpg" // optional: add a poster for faster first paint
        />

        {/* Content */}
        <div className="px-4 pt-8 mx-auto text-center text-white max-w-8xl not-prose">

          <ShinyText
            text="Since 1987 we've got you covered"
            className="mt-16 mb-12 text-3xl lg:mb-24 font-script md:text-3xl lg:text-7xl"
            disabled={false}
            speed={2.5}
          >
          </ShinyText>
          <h1 className="max-w-6xl mx-auto text-4xl md:text-5xl lg:text-7xl justify-center font-display font-bold md:leading-[5rem] lg:leading-[6rem] mb-12 text-white">
            {title}
          </h1>
          <a className="phone-affordance hover:bg-neutral-800/50 transition-colors font-semibold block py-4 px-6 w-fit border border-opacity-60 border-white mx-auto rounded-2xl bg-neutral-800/30 backdrop-blur z-10 text-2xl md:text-4xl tracking-wider text-[--brand-cyan] mb-24" 
            href="tel:+19418664320"
          >
            <Phone className="phone-affordance-icon h-5 w-5 md:h-8 md:w-8 inline mr-2" />
            (941) 866-4320
  
            <span 
              className="mt-2 block font-extralight text-xs tracking-wider text-slate-300"
              >
                CALL TODAY | LICENSE #CCC1331483
            
            </span>
          </a>
        </div>
        
      </section>
    </>
  );
}
