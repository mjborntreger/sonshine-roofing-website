import SmartLink from "./SmartLink"
import Image from "next/image";

const imageHeight = 100;
const imageWidth = 150;
const imageStyles = "my-6 h-[100px] w-auto";


export default async function FooterBadges() {
    return (
        <div className="grid grid-cols-3 lg:grid-cols-9 place-items-center justify-center gap-3 my-10">
          <SmartLink
            href="https://business.sarasotachamber.com/active-member-directory/Details/sonshine-roofing-3821919"
            target="_blank"
            rel="noopener noreferrer"
            title="Sarasota Chamber of Commerce"
            className={imageStyles}
          >
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/Chamber-Accreditation-Logo-4C-5STAR-400x106.png"
              aria-label="Sarasota Chamber of Commerce"
              title="Sarasota Chamber of Commerce"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="Sarasota Chamber of Commerce"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://business.manateechamber.com/list/member/sonshine-roofing-37287"
            target="_blank"
            rel="noopener noreferrer"
            title="Manatee Chamber of Commerce"
            className={imageStyles}
          >
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/2020-Chamber-Proud-Member-Logo_WEB-VERSION_small.bak.webp"
              aria-label="Manatee Chamber of Commerce"
              title="Manatee Chamber of Commerce"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="Manatee Chamber of Commerce"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.northportareachamber.com/list/member/sonshine-roofing-inc-4041"
            target="_blank"
            rel="noopener noreferrer"
            title="North Port Chamber of Commerce"
            className={imageStyles}
          >
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/NPChamberLogo.webp"
              aria-label="North Port Chamber of Commerce"
              title="North Port Chamber of Commerce"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="North Port Chamber of Commerce"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.chamberofcommerce.com/business-directory/florida/sarasota/roofing-contractor/2028411929-sonshine-roofing?source=memberwebsite"
            target="_blank"
            rel="noopener noreferrer"
            title="Chamber of Commerce"
            className={imageStyles}
          >
            <Image
              src="https://coc.codes/images/badge/2028411929"
              aria-label="Chamber of Commerce"
              title="Chamber of Commerce"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="Chamber of Commerce"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.floridaroof.com/SONSHINE-ROOFING-INC-10-1104.html"
            target="_blank"
            rel="noopener noreferrer"
            title="FRSA"
            className={imageStyles}
          >
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/FRSA-400x401.webp"
              aria-label="FRSA"
              title="FRSA"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="Chamber of Commerce"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.nrca.net/Members/Members/Detail/26f0eca5-8397-4524-8ea3-807a1735e028#"
            target="_blank"
            rel="noopener noreferrer"
            title="National Roofing Contractors Association"
            className={imageStyles}
          >
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/National-Roofing-Contractors-Association.webp"
              aria-label="National Roofing Contractors Association"
              title="National Roofing Contractors Association"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="National Roofing Contractors Association"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.gaf.com/en-us/roofing-contractors/residential/sonshine-roofing-inc-1104247"
            target="_blank"
            rel="noopener noreferrer"
            title="GAF Master Elite Certified"
            className={imageStyles}
          >
            <Image
              src="https://next.sonshineroofing.com/wp-content/uploads/master-elite-logo-hi-res-png-400x400.png"
              aria-label="GAF Master Elite Certified"
              title="GAF Master Elite Certified"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="GAF Master Elite Certified"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.expertise.com/fl/sarasota/roofing"
            target="_blank"
            rel="noopener noreferrer"
            title="Expertise.com"
            className={imageStyles}
          >
            <Image
              src="https://res.cloudinary.com/expertise-com/image/upload/remote_media/awards/fl_sarasota_roofing_2025_transparent.svg"
              aria-label="Expertise.com"
              title="Expertise.com"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="Expertise.com"
            >
            </Image>
          </SmartLink>

          <SmartLink
            href="https://www.bbb.org/us/fl/sarasota/profile/roofing-contractors/sonshine-roofing-inc-0653-6096353/#sealclick"
            target="_blank"
            rel="noopener noreferrer"
            title="A+ Rating with the BBB"
            className={imageStyles}
          >
            <Image
              src="https://seal-westflorida.bbb.org/seals/blue-seal-280-80-bbb-6096353.png"
              aria-label="A+ Rating with the BBB"
              title="A+ Rating with the BBB"
              height={imageHeight}
              width={imageWidth}
              loading="lazy"
              decoding="async"
              alt="A+ Rating with the BBB"
            >
            </Image>
          </SmartLink>
        </div>
    )
}