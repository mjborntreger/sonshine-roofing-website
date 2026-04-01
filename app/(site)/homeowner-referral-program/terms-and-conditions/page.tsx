import Section from "@/components/layout/Section";
import SmartLink from "@/components/utils/SmartLink";
import RevealPhone from "@/components/utils/RevealPhone";
import { buildBasicMetadata } from "@/lib/seo/meta";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

const PAGE_PATH = "/homeowner-referral-program/terms-and-conditions";
const SEO_TITLE = "Homeowner Referral Program Terms and Conditions | SonShine Roofing";
const SEO_DESC = "Terms and conditions for the SonShine Roofing Homeowner Referral Program.";

export async function generateMetadata(): Promise<Metadata> {
  return buildBasicMetadata({
    title: SEO_TITLE,
    description: SEO_DESC,
    path: PAGE_PATH,
  });
}

export const revalidate = 86400;

export default function ReferralProgramTermsPage() {
  return (
    <Section>
      <div className="container-edge py-10">
        <div className="prose">
          <div className="not-prose mb-6">
            <SmartLink
              href="/homeowner-referral-program"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
              aria-label="Back to the homeowner referral program page"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Referral Program
            </SmartLink>
          </div>
          <h1>SonShine Roofing Referral Program - Terms & Conditions (2026)</h1>
          <p><strong>Effective Date:</strong> January 1, 2026</p>
          <p>
            The SonShine Roofing Referral Program (&quot;Program&quot;) is offered by SonShine
            Roofing Inc. (&quot;SonShine,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) to reward eligible
            participants for legitimate, good-faith referrals that lead to qualifying full
            roof replacement projects within our service area.
          </p>
          <p>
            By participating in the Program, you agree to the following Terms and Conditions.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            The Program is open to past paying SonShine Roofing customers, current
            SonShine Roofing customers, and Roof Care Club members.
          </p>
          <p>To qualify under the Program, the referred person should be:</p>
          <ul>
            <li>The legal owner of the property receiving the roof replacement.</li>
            <li>
              Seeking service for a property located within SonShine Roofing&rsquo;s service
              area: Sarasota County, Florida; Manatee County, Florida; or Charlotte
              County, Florida.
            </li>
          </ul>
          <p>
            SonShine reserves the right to verify eligibility, service area, and referral
            details at any time.
          </p>

          <h2>2. Referral Qualification Requirements</h2>
          <p>To qualify for a referral reward:</p>
          <ul>
            <li>The referral must relate to a full roof replacement project.</li>
            <li>
              Roof repairs, inspections, maintenance services, and partial roofing
              projects do not qualify.
            </li>
            <li>Self-referrals do not qualify.</li>
            <li>
              The referred person may contact SonShine Roofing by calling{" "}
              <a href="tel:+19418664320">(941) 866-4320</a> during business hours or by
              submitting a contact request at{" "}
              <a href="https://sonshineroofing.com/contact-us">
                https://sonshineroofing.com/contact-us
              </a>.
            </li>
            <li>
              When reaching out, the referred person should provide the referrer&rsquo;s
              name, phone number, and preferred email address.
            </li>
            <li>
              A referral may still be credited after initial contact if SonShine receives
              the referral information before the sale is made. Once the job is approved,
              the referral-credit window closes.
            </li>
            <li>
              A referral becomes a qualified referral only after the referred full roof
              replacement job is approved, completed, and paid in full.
            </li>
          </ul>
          <p>
            Estimates, consultations, and inquiries alone do not qualify for a reward.
          </p>

          <h2>3. Referral Reward</h2>
          <p>
            Eligible referrers will receive $250 for each qualified referral.
          </p>
          <p>
            Payment is made by check mailed by SonShine Roofing within 7 business days
            after the referred job reaches paid in full status.
          </p>

          <h2>4. Limitations & Restrictions</h2>
          <p>
            There is no fixed cap on the number of referral rewards an eligible referrer
            may earn.
          </p>
          <p>
            The Program is limited to legitimate, good-faith referrals. SonShine reserves
            the right to decline, deny, or refuse any referral reward if we determine that
            referral activity is spammy, abusive, manipulated, suspicious, bad-faith, or
            otherwise illegitimate.
          </p>
          <p>
            If multiple parties claim the same referral, SonShine will review the facts
            and determine in its sole discretion whether any referral credit will be given
            and to whom.
          </p>
          <p>
            Referral rewards are paid only for qualified full roof replacement jobs that
            are completed and paid in full.
          </p>

          <h2>5. Program Changes & Termination</h2>
          <p>SonShine Roofing reserves the right to:</p>
          <ul>
            <li>Modify, suspend, or terminate the Referral Program at any time.</li>
            <li>Change reward amounts or eligibility rules for future referrals.</li>
            <li>
              Refuse payment if fraud, abuse, manipulation, or other misuse of the Program
              is suspected.
            </li>
          </ul>
          <p>
            Any changes will not affect referral rewards already earned prior to modification.
          </p>

          <h2>6. No Agency Relationship</h2>
          <p>
            Participation in the Referral Program does not create an employment, partnership,
            joint venture, or agency relationship between the referrer and SonShine Roofing.
          </p>
          <p>Referrers are not authorized to:</p>
          <ul>
            <li>Negotiate pricing,</li>
            <li>Make binding promises, warranties, or representations,</li>
            <li>Present themselves as employees, agents, partners, or representatives of SonShine Roofing.</li>
          </ul>

          <h2>7. Discretion & Final Authority</h2>
          <p>
            SonShine Roofing reserves the right to verify eligibility, referral ownership,
            project qualification, and compliance with these Terms. All determinations
            regarding eligibility, duplicate claims, qualification, and reward payment are
            made in SonShine&rsquo;s sole discretion, and all decisions are final.
          </p>

          <h2>8. Contact Information</h2>
          <p>
            For questions about referral status, payout status, disputes, duplicate claims,
            or program eligibility, contact SonShine Roofing directly at:
          </p>
          <address className="not-italic">
            <div>
              <RevealPhone e164="+19418664320" display="(941) 866-4320" />
            </div>
            <div>Monday through Friday, 7:30 AM to 4:00 PM EST</div>
          </address>
        </div>
      </div>
    </Section>
  );
}
