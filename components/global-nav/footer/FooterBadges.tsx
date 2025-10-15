import SmartLink from "../../utils/SmartLink";
import Image from "next/image";

const imageHeight = 100;
const imageWidth = 150;
const imageStyles = "my-6 h-[100px] w-auto";

const badges = [
   {
    href: "https://mysafeflhome.com/",
    title: "My Safe Florida Home Certified Contractor",
    src: "https://next.sonshineroofing.com/wp-content/uploads/MSFLH-Logo.png",
  },
  {
    href: "https://business.sarasotachamber.com/active-member-directory/Details/sonshine-roofing-3821919",
    title: "Sarasota Chamber of Commerce",
    src: "https://next.sonshineroofing.com/wp-content/uploads/Chamber-Accreditation-Logo-4C-5STAR-400x106.png",
  },
  {
    href: "https://business.manateechamber.com/list/member/sonshine-roofing-37287",
    title: "Manatee Chamber of Commerce",
    src: "https://next.sonshineroofing.com/wp-content/uploads/2020-Chamber-Proud-Member-Logo_WEB-VERSION_small.bak.webp",
  },
  {
    href: "https://www.northportareachamber.com/list/member/sonshine-roofing-inc-4041",
    title: "North Port Chamber of Commerce",
    src: "https://next.sonshineroofing.com/wp-content/uploads/NPChamberLogo.webp",
  },
  {
    href: "https://www.floridaroof.com/SONSHINE-ROOFING-INC-10-1104.html",
    title: "FRSA",
    src: "https://next.sonshineroofing.com/wp-content/uploads/FRSA-400x401.webp",
  },
  {
    href: "https://www.nrca.net/Members/Members/Detail/26f0eca5-8397-4524-8ea3-807a1735e028#",
    title: "National Roofing Contractors Association",
    src: "https://next.sonshineroofing.com/wp-content/uploads/National-Roofing-Contractors-Association.webp",
  },
  {
    href: "https://www.gaf.com/en-us/roofing-contractors/residential/sonshine-roofing-inc-1104247",
    title: "GAF Master Elite Certified",
    src: "https://next.sonshineroofing.com/wp-content/uploads/master-elite-logo-hi-res-png-400x400.png",
  },
  {
    href: "https://www.expertise.com/fl/sarasota/roofing",
    title: "Expertise.com",
    src: "https://res.cloudinary.com/expertise-com/image/upload/remote_media/awards/fl_sarasota_roofing_2025_transparent.svg",
  },
  {
    href: "https://www.bbb.org/us/fl/sarasota/profile/roofing-contractors/sonshine-roofing-inc-0653-6096353/#sealclick",
    title: "A+ Rating with the BBB",
    src: "https://next.sonshineroofing.com/wp-content/uploads/bbb.webp",
  },
];

export default function FooterBadges() {
  return (
    <div className="mx-auto max-w-6xl px-10 grid grid-cols-3 lg:grid-cols-9 place-items-center justify-center gap-3 my-20">
      {badges.map((badge) => (
        <SmartLink
          key={badge.href}
          href={badge.href}
          target="_blank"
          rel="noopener noreferrer"
          title={badge.title}
          className={imageStyles}
        >
          <Image
            src={badge.src}
            alt={badge.title}
            title={badge.title}
            height={imageHeight}
            width={imageWidth}
            sizes="(max-width: 150px) 25vw, 366px"
            loading="lazy"
            decoding="async"
          />
        </SmartLink>
      ))}
    </div>
  );
}
