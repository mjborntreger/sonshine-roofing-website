import Image from "next/image";
import { BestOfTheBestVideo } from "./BestOfTheBestVideo";

const imageHeight = 175;
const imageWidth = 175;
const imageClasses = "transition-transform duration-200 ease-out group-hover:translate-y-[1px] group-hover:drop-shadow-sm"

export default async function bestOfTheBest() {
  return (
    <div
      aria-labelledby="botb-title"
      className="border border-[--brand-orange] rounded-xl bg-white shadow-lg p-8 md:p-10"
    >
      <div className="text-center">
        <h2>Best of the Best Award Winner (2021–2025)</h2>
      </div>
      <div className="gradient-divider my-4" />
      

      {/* Badges: responsive, semantic list with subtle hover affordances */}
      <ul className="mt-10 grid grid-cols-5 place-items-center justify-center gap-4">
        <li className="group relative">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/2021-Best-of-the-Best-award-icon.bak-175x175.webp"
            aria-label="Best of the Best 2021 Award"
            title="Best of the Best 2021 Award"
            height={imageHeight}
            width={imageWidth}
            priority
            loading="eager"
            decoding="async"
            alt="Best of the Best 2021 Award"
            className={imageClasses}
          />
        </li>

        <li className="group relative">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/2022-Best-of-the-Best-award-icon.bak-175x175.webp"
            aria-label="Best of the Best 2022 Award"
            title="Best of the Best 2022 Award"
            height={imageHeight}
            width={imageWidth}
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2022 Award"
            className={imageClasses}
          />
          
        </li>

        <li className="group relative">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/2023-best-of-the-best-award.bak-175x175.webp"
            aria-label="Best of the Best 2023 Award"
            title="Best of the Best 2023 Award"
            height={imageHeight}
            width={imageWidth}
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2023 Award"
            className={imageClasses}
          />
          
        </li>

        <li className="group relative">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/backup/2024-Best-of-the-Best-badge-icon-1-175x175.webp"
            aria-label="Best of the Best 2024 Award"
            title="Best of the Best 2024 Award"
            height={imageHeight}
            width={imageWidth}
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2024 Award"
            className={imageClasses}
          />
          
        </li>

        <li className="group relative">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/BOTB25_Award_1080px-175x175.webp"
            aria-label="Best of the Best 2025 Award"
            title="Best of the Best 2025 Award"
            height={imageHeight}
            width={imageWidth}
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2025 Award"
            className={imageClasses}
          />
          
        </li>
      </ul>

      <div className="mt-16 grid gap-8 grid-cols-1 md:grid-cols-2 items-start mx-auto">
        <figure className="text-slate-900">
          <blockquote className="italic text-md">
            <p>
              "You found one of the most <strong>positively reviewed</strong> roofing companies anywhere,
              SonShine Roofing in Florida, which is now a 5-time winner of our national
              Best of the Best award."
            </p>
          </blockquote>
          <figcaption className="mt-6 text-md text-right not-italic">—Rich Noonan, Best of the Best TV</figcaption>
        </figure>

        <div className="relative">
          {/* Video component handles its own layout; wrapper keeps spacing predictable */}
          <BestOfTheBestVideo />
        </div>
      </div>
    </div>
  );
}