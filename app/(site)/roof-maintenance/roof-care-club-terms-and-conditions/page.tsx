import Section from "@/components/layout/Section";
import RevealEmail from "@/components/utils/RevealEmail";
import RevealPhone from "@/components/utils/RevealPhone";
import { buildBasicMetadata } from "@/lib/seo/meta";
import type { Metadata } from "next";

const PAGE_PATH = "/roof-maintenance/roof-care-club-terms-and-conditions";
const SEO_TITLE = "Roof Care Club Terms and Conditions | SonShine Roofing";
const SEO_DESC = "Terms and conditions for the SonShine Roofing Roof Care Club maintenance membership.";

export async function generateMetadata(): Promise<Metadata> {
  return buildBasicMetadata({
    title: SEO_TITLE,
    description: SEO_DESC,
    path: PAGE_PATH,
  });
}

export const revalidate = 86400;

export default function RoofCareClubTermsPage() {
  return (
    <Section>
      <div className="container-edge py-10">
        <div className="prose">
          <h1>Roof Care Club Terms and Conditions</h1>
          <p><strong>Effective Date:</strong> 02/10/2026</p>
          <p>
            These Terms and Conditions (&quot;Terms&quot;) govern participation in the Roof Care Club
            maintenance membership (&quot;Membership&quot;) offered by SonShine Roofing Inc. (&quot;SonShine Roofing&quot;).
            By enrolling, scheduling service, or paying for a Membership, you agree to these
            Terms. If you have a signed agreement or proposal that conflicts with these Terms,
            the signed agreement controls.
          </p>

          <h2>1. Membership Overview</h2>
          <p>
            The Roof Care Club provides scheduled roof inspections, documentation, and
            maintenance guidance for the enrolled property. Membership benefits are intended
            for preventative care and do not guarantee the condition or remaining life of a roof.
          </p>

          <h2>2. Term Options, Pricing, and Billing</h2>
          <p>
            All Membership terms are billed upfront. Current pricing and term details are listed
            below and may change for future enrollments or renewals.
          </p>
          <table>
            <thead>
              <tr>
                <th>Term</th>
                <th>Annual price</th>
                <th>Total billed</th>
                <th>Repair discount</th>
                <th>Additional inspections</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1 year</td>
                <td>$189</td>
                <td>$189</td>
                <td>No discount</td>
                <td>No discount</td>
              </tr>
              <tr>
                <td>2 years</td>
                <td>$179</td>
                <td>$358</td>
                <td>5% off eligible repairs</td>
                <td>50% off additional inspections</td>
              </tr>
              <tr>
                <td>3 years</td>
                <td>$169</td>
                <td>$507</td>
                <td>10% off eligible repairs</td>
                <td>Free additional inspections</td>
              </tr>
            </tbody>
          </table>
          <p>
            Pricing excludes taxes and any third-party fees. Discounts apply to eligible services
            performed by SonShine and are not combinable with other promotions unless stated.
          </p>

          <h2>3. Included Benefits</h2>
          <p>Current Membership benefits include:</p>
          <ul>
            <li>One complimentary Tip Top Roof Check-up per year</li>
            <li>Standardized 18-point inspection checklist</li>
            <li>Photo documentation stored in your customer record</li>
            <li>Maintenance notes for planning and insurance reference</li>
            <li>One complimentary giftable roof inspection per year</li>
          </ul>
          <p>
            Benefits may evolve based on safety, materials, and service availability. Any material
            change will be communicated before renewal.
          </p>

          <h2>4. Free Trial Membership for Existing Customers</h2>
          <p>
            Roof replacement customers receive 2 years of Roof Care Club Membership at no cost.
            Roof repair customers receive 1 year of Roof Care Club Membership at no cost. These
            complimentary terms apply to the serviced property and are not transferable.
          </p>

          <h2>5. Scheduling and Access</h2>
          <p>
            Inspections are scheduled by appointment. You agree to provide safe access to the
            property and to notify SonShine Roofing of hazards or restrictions. Weather, safety concerns,
            or access issues may require rescheduling.
          </p>

          <h2>6. Limitations and Exclusions</h2>
          <p>
            The Membership is not an insurance policy and does not include roof replacement or
            repair work unless separately authorized.
          </p>

          <h2>7. Cancellations, Transfers, and Refunds</h2>
          <p>
            You may request cancellation in writing at any time. Memberships are expressly non-transferrable. 
            Refunds, if any, are handled according to your signed agreement or as required by law. 
            Complimentary Memberships end when the underlying service agreement is canceled or voided.
          </p>

          <h2>8. Changes to These Terms</h2>
          <p>
            SonShine may update these Terms from time to time. Updates will be posted on this page
            with a revised effective date. Continued participation after changes indicates acceptance.
          </p>

          <h2>9. Contact Us</h2>
          <address className="not-italic">
            <div>SonShine Roofing Inc.</div>
            <div>2555 Porter Lake Drive Ste. 109, Sarasota, Florida, USA.</div>
            <RevealEmail encoded="bWFya2V0aW5nQHNvbnNoaW5lcm9vZmluZy5jb20=" />
            <RevealPhone e164="+19418664320" extension="106" />
          </address>
        </div>
      </div>
    </Section>
  );
}
