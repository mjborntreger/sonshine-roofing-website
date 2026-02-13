import Section from "@/components/layout/Section";
import RevealEmail from "@/components/utils/RevealEmail";
import RevealPhone from "@/components/utils/RevealPhone";
import { buildBasicMetadata } from "@/lib/seo/meta";
import type { Metadata } from "next";

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
          <h1>SonShine Roofing Referral Program - Terms & Conditions (2026)</h1>
          <p><strong>Effective Date:</strong> January 1, 2026</p>
          <p>
            The SonShine Roofing Referral Program ("Program") is offered by SonShine
            Roofing Inc. ("SonShine," "we," "us," or "our") to reward eligible past
            customers for referring new roof replacement customers.
          </p>
          <p>
            By participating in the Program, you agree to the following Terms and Conditions.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            The Referral Program is open only to past SonShine Roofing customers who
            have previously completed a roof repair or roof replacement project with
            SonShine Roofing.
          </p>
          <p>The referred individual must be:</p>
          <ul>
            <li>A new customer to SonShine Roofing (no prior contracts for roof replacement with SonShine).</li>
            <li>The legal owner of the property receiving the roof replacement.</li>
            <li>Located within SonShine Roofing's service area.</li>
          </ul>
          <p>
            Employees of SonShine Roofing, their immediate family members, and
            subcontractors are not eligible to participate.
          </p>
          <p>SonShine reserves the right to verify eligibility at its sole discretion.</p>

          <h2>2. Referral Qualification Requirements</h2>
          <p>To qualify for a referral reward:</p>
          <p>The referred customer must:</p>
          <ul>
            <li>Contact SonShine Roofing and explicitly mention the referrer's name at the time of initial contact.</li>
            <li>Schedule and complete a roof replacement estimate.</li>
            <li>Enter into a signed contract with SonShine Roofing for a full roof replacement.</li>
            <li>Successfully complete the roof replacement project.</li>
            <li>Pay the contract price in full.</li>
          </ul>
          <p>
            The referral reward will only be issued after the roof replacement project
            is fully completed and paid in full.
          </p>
          <p>
            Estimates alone do not qualify. Repairs do not qualify. Partial projects do not qualify.
          </p>

          <h2>3. Referral Reward</h2>
          <p>
            Eligible referrers will receive $250 per qualified roof replacement referral,
            as advertised in the official SonShine Roofing Referral Program materials
            (New Roof Care Club Whitepaper _...).
          </p>
          <p>
            Payment will be made via ACH transfer (or other method at SonShine's discretion)
            within a reasonable processing period following project completion and full payment.
          </p>
          <p>The referrer is responsible for providing accurate payment information.</p>
          <p>
            Referrers are responsible for any applicable tax reporting obligations related
            to referral payments.
          </p>

          <h2>4. Limitations & Restrictions</h2>
          <p>Referral rewards are paid only when a roof replacement is successfully purchased and completed.</p>
          <p>
            The Program applies to roof replacement projects only. Roof repairs, inspections,
            maintenance services, or other services do not qualify.
          </p>
          <p>
            The Program is limited to legitimate, good-faith referrals. Self-referrals are not permitted.
          </p>
          <p>
            If multiple individuals claim the same referral, SonShine Roofing will determine,
            in its sole discretion, which referrer (if any) qualifies based on documentation and timing.
          </p>
          <p>
            Referrals must be submitted before or at the time of the referred party's first
            contact with SonShine Roofing. Retroactive referrals will not be honored.
          </p>

          <h2>5. Program Changes & Termination</h2>
          <p>SonShine Roofing reserves the right to:</p>
          <ul>
            <li>Modify, suspend, or terminate the Referral Program at any time.</li>
            <li>Change reward amounts.</li>
            <li>Refuse payment if fraud, abuse, or manipulation of the Program is suspected.</li>
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
            <li>Make binding representations,</li>
            <li>Present themselves as employees or agents of SonShine Roofing.</li>
          </ul>

          <h2>7. Discretion & Final Authority</h2>
          <p>
            All determinations regarding eligibility, qualification, and reward payment are
            made at the sole discretion of SonShine Roofing. All decisions are final.
          </p>

          <h2>8. Contact Information</h2>
          <p>For questions regarding the Referral Program:</p>
          <address className="not-italic">
            <RevealPhone e164="+19413779933" display="(941) 377-9933" />
            <RevealEmail encoded="bWFya2V0aW5nQHNvbnNoaW5lcm9vZmluZy5jb20=" />
          </address>
        </div>
      </div>
    </Section>
  );
}
