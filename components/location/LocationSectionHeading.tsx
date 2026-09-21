import { SECTION_HEADING, SECTION_SUBTITLE } from '@/components/location/sectionStyles';
import { renderHighlight } from '@/components/utils/renderHighlight';

type Props = {
  id?: string;
  heading: string;
  highlightText?: string | readonly string[];
  description: string;
};

export default function LocationSectionHeading({ id, heading, highlightText, description }: Props) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 id={id} className={SECTION_HEADING}>{renderHighlight(heading, highlightText)}</h2>
      <p className={SECTION_SUBTITLE}>{description}</p>
    </div>
  );
}
