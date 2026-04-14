import Section from "@/components/layout/Section";
import SmartLink from "@/components/utils/SmartLink";
import { buildBasicMetadata } from "@/lib/seo/meta";
import { ArrowLeft } from "lucide-react";
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
        <div className="not-prose mb-6">
          <SmartLink
            href="/roof-maintenance#roof-care-club"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
            aria-label="Back to the Roof Care Club page"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Roof Care Club
          </SmartLink>
        </div>
        <div className="prose">
          <h1>Roof Care Club Terms and Conditions</h1>
          <p><strong>Effective Date:</strong> 04/12/2026</p>
          <p>
            These Terms and Conditions (&quot;Terms&quot;) govern participation in the Roof Care Club
            maintenance membership (&quot;Membership&quot;) offered by <strong>SonShine Roofing Inc.</strong>
            {" "}
            (&quot;SonShine Roofing,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By enrolling in the Membership,
            paying for the Membership, renewing the Membership, or scheduling services under
            the Membership, you agree to these Terms. If you have a signed proposal, contract,
            or other written agreement with SonShine Roofing that directly conflicts with
            these Terms, the signed agreement will control to the extent of that conflict.
          </p>

          <h2>1. Membership Overview</h2>
          <p>
            The Roof Care Club is a preventative maintenance membership designed to help
            homeowners stay ahead of roofing issues through recurring inspections, photo
            documentation, and maintenance guidance. Membership benefits are intended for
            preventative care only. Membership does not guarantee the condition, performance,
            or remaining life of any roof, and it is not an insurance policy, warranty
            extension, or promise that repairs or replacement will not be needed.
          </p>

          <h2>2. Term Options, Pricing, and Billing</h2>
          <p>Roof Care Club is currently offered in the following term options:</p>
          <table>
            <thead>
              <tr>
                <th>Term</th>
                <th>Annual Price</th>
                <th>Total Billed</th>
                <th>Repair Discount</th>
                <th>Additional Inspection Benefit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1 Year</td>
                <td>$189</td>
                <td>$189</td>
                <td>No discount</td>
                <td>No discount</td>
              </tr>
              <tr>
                <td>2 Years</td>
                <td>$179</td>
                <td>$358</td>
                <td>5% off eligible repairs</td>
                <td>50% off additional inspections</td>
              </tr>
              <tr>
                <td>3 Years</td>
                <td>$169</td>
                <td>$507</td>
                <td>10% off eligible repairs</td>
                <td>Additional inspections included at no extra charge</td>
              </tr>
            </tbody>
          </table>
          <p>
            All paid Membership terms are billed in advance unless otherwise stated in writing
            by SonShine Roofing. Pricing, discounts, and included benefits may change for
            future enrollments or renewals. Any such changes will not retroactively alter a
            Membership term that has already been paid for or activated unless required by law
            or agreed in writing.
          </p>
          <p>
            Taxes, permit fees, third-party charges, and non-covered services are not included
            unless expressly stated.
          </p>

          <h2>3. Included Benefits</h2>
          <p>
            Unless otherwise stated in writing, each active Membership includes the following
            during each Membership Year:
          </p>
          <ul>
            <li>One complimentary Tip Top Roof Check-up for the enrolled property</li>
            <li>SonShine Roofing&apos;s standard inspection checklist</li>
            <li>Photo documentation retained in the customer record</li>
            <li>General notes for maintenance planning and insurance reference</li>
            <li>
              One complimentary giftable roof inspection per Membership Year, subject to
              SonShine Roofing&apos;s service area, scheduling availability, and standard
              service limitations
            </li>
          </ul>
          <p>
            Membership benefits may evolve from time to time based on safety considerations,
            staffing, materials, service area limitations, or operational needs. Any material
            changes affecting future renewals will be communicated before renewal.
          </p>

          <h2>4. Complimentary Memberships for Existing Customers</h2>
          <p>
            SonShine Roofing may include complimentary Roof Care Club Memberships with certain
            services, including:
          </p>
          <ul>
            <li><strong>Roof replacement customers:</strong> 2 years at no additional cost</li>
            <li><strong>Roof repair customers:</strong> 1 year at no additional cost</li>
          </ul>
          <p>
            Complimentary Memberships apply only to the serviced property, have no cash value,
            are not redeemable for cash or credit, and are not transferable unless SonShine
            Roofing agrees otherwise in writing. If the underlying service agreement is
            canceled, rescinded, voided, or not completed, the related complimentary
            Membership may be canceled as well.
          </p>

          <h2>5. Target Inspection Dates, Scheduling Window, and Annual Inspection Use</h2>
          <p>
            Each Membership includes <strong>one complimentary inspection per Membership Year</strong>.
          </p>
          <p>
            For purposes of these Terms, a <strong>&quot;Membership Year&quot;</strong> means each
            12-month period beginning on the Member&apos;s original enrollment date, activation
            date, or complimentary activation date, as reflected in SonShine Roofing&apos;s records.
          </p>
          <p>
            A Member&apos;s <strong>&quot;Target Inspection Date&quot;</strong> is the annual anniversary
            of that enrollment or activation date for each Membership Year. For multi-year
            terms, Target Inspection Dates repeat once per year during each covered Membership
            Year. By way of example, a 3-year Membership includes three separate Membership
            Years and three separate annual Target Inspection Dates.
          </p>
          <p>
            Members must <strong>schedule</strong> their included annual inspection within a
            {" "}
            <strong>60-day window</strong>, consisting of the <strong>30 calendar days before</strong>
            {" "}and the <strong>30 calendar days after</strong> the applicable Target
            Inspection Date.
          </p>
          <p>
            A scheduling request made within that 60-day window will count as timely even if
            the actual inspection occurs later due to weather, safety concerns, access
            limitations, route availability, office closures, or SonShine Roofing&apos;s next
            reasonably available appointment date, so long as the delay is not caused by the
            Member&apos;s failure to respond, provide access, or cooperate with scheduling.
          </p>
          <p>
            If a Member does not request scheduling within the required 60-day window,
            SonShine Roofing may treat that year&apos;s included inspection as <strong>forfeited</strong>.
            {" "}A forfeited inspection:
          </p>
          <ul>
            <li>does not roll over into a later Membership Year,</li>
            <li>does not create a credit, refund, or cash value,</li>
            <li>does not extend the Membership term, and</li>
            <li>
              does not entitle the Member to an additional inspection outside the applicable
              Membership Year.
            </li>
          </ul>
          <p>
            Courtesy reminders may be sent by email, phone, or text, but Members remain
            responsible for tracking their own Target Inspection Dates and keeping their
            contact information current. Failure to receive a reminder does <strong>not</strong>
            {" "}extend the scheduling window, revive a forfeited inspection, or waive these
            Terms.
          </p>
          <p>
            If a Target Inspection Date falls on a date that does not exist in a given year,
            such as February 29, the Target Inspection Date for that year will be deemed to
            fall on the last calendar day of that month unless SonShine Roofing determines
            another reasonable equivalent date.
          </p>

          <h2>6. Exceptions to the Scheduling Window</h2>
          <p>
            SonShine Roofing understands that life happens. A Member who needs flexibility
            outside the standard 60-day scheduling window must notify SonShine Roofing
            {" "}
            <strong>at least 15 calendar days before</strong> the applicable Target Inspection
            Date and request an exception.
          </p>
          <p>Exceptions:</p>
          <ul>
            <li>must be communicated in advance,</li>
            <li>are reviewed <strong>case by case</strong>,</li>
            <li>
              are granted or denied in the <strong>sole discretion of SonShine Roofing</strong>,
              and
            </li>
            <li>
              may be conditioned on factors such as account status, prior communication,
              weather, seasonal workload, property access, and appointment availability.
            </li>
          </ul>
          <p>
            An approved exception applies only to the specific Membership Year and circumstance
            for which it is granted unless SonShine Roofing confirms otherwise in writing.
            Approval of one exception does not guarantee approval of future exceptions and does
            not permanently change the Member&apos;s Target Inspection Date unless SonShine
            Roofing expressly agrees in writing.
          </p>
          <p>Late exception requests may be denied.</p>

          <h2>7. Scheduling, Access, and Service Conditions</h2>
          <p>
            All inspections are by appointment only and subject to availability. Members agree
            to provide SonShine Roofing with safe, reasonable access to the property, including
            access to the roof, driveway, yard, gates, and any other areas reasonably
            necessary to perform the inspection.
          </p>
          <p>
            The Member is responsible for informing SonShine Roofing in advance of any known
            hazards, animals, locked gates, access restrictions, fragile surfaces, active
            leaks, electrical concerns, unsafe structural conditions, or other conditions that
            could affect safety or scheduling.
          </p>
          <p>
            The Member must also inform SonShine Roofing if their primary contact 
            information (phone number, email) has changed. Failure to do so before the end of 
            his/her scheduling window may result in a loss of benefits at the discretion of 
            SonShine Roofing. 
          </p>
          <p>
            SonShine Roofing may reschedule, delay, decline, or discontinue service if weather
            conditions, unsafe roof conditions, restricted access, site hazards, force majeure
            events, governmental restrictions, or other circumstances outside our reasonable
            control make inspection unsafe, impractical, or impossible.
          </p>

          <h2>8. Lapse, Non-Use, and Good Standing</h2>
          <p>
            Membership benefits are available only while the Membership is active and in good
            standing. SonShine Roofing may deny, postpone, or suspend Membership benefits if
            payment has failed, the Membership has expired, the Membership has been canceled,
            or the Member is otherwise not in good standing under the applicable agreement.
          </p>
          <p>
            If a Membership expires or lapses before a forfeited or unused annual inspection is
            scheduled in accordance with these Terms, that unused inspection is lost and does
            not survive expiration unless SonShine Roofing expressly agrees otherwise in
            writing.
          </p>

          <h2>9. Limitations and Exclusions</h2>
          <p>
            Membership benefits do not include roof repair, roof replacement, emergency
            service, storm response, interior work, structural corrections, code upgrades, or
            any other labor, materials, or services unless separately proposed and authorized.
          </p>
          <p>
            Inspection findings, notes, photos, and recommendations are informational in nature
            and reflect conditions observed at the time of service. They are not a guarantee
            that concealed conditions do not exist or that new conditions will not develop
            after the inspection.
          </p>
          <p>
            Membership does not create a fiduciary duty, ongoing monitoring obligation, or duty
            to remind Members when inspections are due beyond any reminder SonShine Roofing may
            choose to provide as a courtesy.
          </p>

          <h2>10. Discounts and Eligible Services</h2>
          <p>
            Any repair or inspection discounts associated with a Membership apply only to
            eligible services performed by SonShine Roofing during an active Membership term
            and only for the enrolled property, unless SonShine Roofing agrees otherwise in
            writing.
          </p>
          <p>Discounts:</p>
          <ul>
            <li>have no cash value,</li>
            <li>are not redeemable for prior work,</li>
            <li>are not retroactive,</li>
            <li>
              may not be combined with other offers unless SonShine Roofing expressly allows
              it, and
            </li>
            <li>
              do not apply to excluded services, third-party charges, permits, taxes, or other
              non-discountable items.
            </li>
          </ul>

          <h2>11. Cancellations, Transfers, and Refunds</h2>
          <p>
            A Member may request cancellation in writing. Unless otherwise required by law or
            expressly stated in a signed agreement, paid Memberships are generally
            {" "}
            <strong>non-refundable once the Membership term has begun</strong>, especially
            where pricing reflects advance commitment and reserved service value over time.
          </p>
          <p>
            Memberships are non-transferable and apply only to the enrolled property unless
            SonShine Roofing approves a transfer in writing.
          </p>
          <p>
            Complimentary Memberships are promotional in nature, are not refundable, and may
            be canceled if the underlying qualifying service agreement is canceled, rescinded,
            or otherwise invalidated.
          </p>

          <h2>12. Changes to These Terms</h2>
          <p>
            SonShine Roofing may update these Terms from time to time. Updated Terms will be
            posted on this page with a revised Effective Date. Continued participation in the
            Membership after updated Terms are posted constitutes acceptance of those updated
            Terms, unless a separate signed agreement provides otherwise.
          </p>

          <h2>13. Contact Information</h2>
          <address className="not-italic">
            <div><strong>SonShine Roofing Inc.</strong></div>
            <div>2555 Porter Lake Drive, Ste. 109</div>
            <div>Sarasota, FL 34240</div>
            <div>Phone: (941) 866-4320</div>
            <div>Email: messages@sonshineroofing.com</div>
          </address>
        </div>
      </div>
    </Section>
  );
}
