import Image from "next/image";
import { BestOfTheBestVideo } from "@/components/marketing/landing-page/BestOfTheBestVideo";



const imageHeight = 175;
const imageWidth = 175;
const imageClasses = "transition-transform duration-200 ease-out group-hover:translate-y-[1px] group-hover:drop-shadow-sm";

type BestOfTheBestProps = {
  title?: string
  highlightText?: string;
};

const defaultHighlight = "Sarasota's Best Roofer";

export default async function bestOfTheBest({
  title = `Voted ${defaultHighlight} for 5 Years`,
  highlightText = defaultHighlight
}: BestOfTheBestProps) {
  const highlightIndex = title.indexOf(highlightText);
  const renderedTitle =
    highlightIndex >= 0 ? (
      <>
        {title.slice(0, highlightIndex)}
        <span className="text-[--brand-blue]">{highlightText}</span>
        {title.slice(highlightIndex + highlightText.length)}
      </>
    ) : (
      title
    );
  return (
    <section className="px-4 py-32">
      <div
        aria-label="botb-title"
        id="botb-title"
      >
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl text-slate-700">
            {renderedTitle}
          </h2>
          <p className="mt-2 mb-8 text-sm text-slate-500" >Our reputation</p>
        </div>
      </div>


      {/* Badges: responsive, semantic list with subtle hover affordances */}
      <ul className="grid justify-center grid-cols-5 gap-4 my-16 place-items-center">
        <li className="relative group">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/2021-Best-of-the-Best-award-icon.bak-175x175.webp"
            aria-label="Best of the Best 2021 Award"
            title="Best of the Best 2021 Award"
            height={imageHeight}
            width={imageWidth}
            sizes="(max-width: 175px) 15vw, 366px"
            priority
            loading="eager"
            decoding="async"
            alt="Best of the Best 2021 Award"
            className={imageClasses}
          />
        </li>

        <li className="relative group">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/2022-Best-of-the-Best-award-icon.bak-175x175.webp"
            aria-label="Best of the Best 2022 Award"
            title="Best of the Best 2022 Award"
            height={imageHeight}
            width={imageWidth}
            sizes="(max-width: 175px) 15vw, 366px"
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2022 Award"
            className={imageClasses}
          />

        </li>

        <li className="relative group">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/2023-best-of-the-best-award.bak-175x175.webp"
            aria-label="Best of the Best 2023 Award"
            title="Best of the Best 2023 Award"
            height={imageHeight}
            width={imageWidth}
            sizes="(max-width: 175px) 15vw, 366px"
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2023 Award"
            className={imageClasses}
          />

        </li>

        <li className="relative group">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/backup/2024-Best-of-the-Best-badge-icon-1-175x175.webp"
            aria-label="Best of the Best 2024 Award"
            title="Best of the Best 2024 Award"
            height={imageHeight}
            width={imageWidth}
            sizes="(max-width: 175px) 15vw, 366px"
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2024 Award"
            className={imageClasses}
          />

        </li>

        <li className="relative group">
          <Image
            src="https://next.sonshineroofing.com/wp-content/uploads/BOTB25_Award_1080px-175x175.webp"
            aria-label="Best of the Best 2025 Award"
            title="Best of the Best 2025 Award"
            height={imageHeight}
            width={imageWidth}
            sizes="(max-width: 175px) 15vw, 366px"
            loading="lazy"
            decoding="async"
            alt="Best of the Best 2025 Award"
            className={imageClasses}
          />

        </li>
      </ul>

      <div className="grid items-start grid-cols-1 gap-8 mx-auto mt-16 md:grid-cols-2">
        <figure className="text-slate-900">
          <blockquote className="italic text-md">
            <p>
              &ldquo;You found one of the most <strong>positively reviewed</strong> roofing companies anywhere,
              SonShine Roofing in Florida, which is now a 5-time winner of our national
              Best of the Best award.&rdquo;
            </p>
          </blockquote>
          <figcaption className="mt-6 not-italic text-right text-md">—Rich Noonan, Best of the Best TV</figcaption>
        </figure>

        <div className="relative">
          {/* Video component handles its own layout; wrapper keeps spacing predictable */}
          <BestOfTheBestVideo />
        </div>
      </div>
    </section>
  );
}
