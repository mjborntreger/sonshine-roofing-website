import Section from "@/components/layout/Section";
import RevealEmail from "@/components/utils/RevealEmail";
import RevealPhone from "@/components/utils/RevealPhone";
import type { Metadata } from "next";

// ===== STATIC SEO FOR /privacy-policy =====
const SEO_TITLE = "Privacy Policy | SonShine Roofing";
const SEO_DESC = "How SonShine Roofing collects, uses, and protects your information when you visit sonshineroofing.com.";
const CANONICAL = "/privacy-policy";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_TITLE,
    description: SEO_DESC,
    alternates: { canonical: CANONICAL },
    openGraph: {
      type: "website",
      title: SEO_TITLE,
      description: SEO_DESC,
      url: CANONICAL,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE,
      description: SEO_DESC,
      images: ["/og-default.png"],
    },
  };
}

export const revalidate = 86400; // daily ISR

export default function PrivacyPolicyPage() {
  return (
    <Section>
      <div className="container-edge py-10">
        <div className="prose">
          <h1>Privacy Policy</h1>
          <p><strong>Effective Date:</strong> 05/27/2026</p>
          <p>
            SonShine Roofing Inc. is committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, and safeguard your information when you visit
            {" "}
            <a href="https://sonshineroofing.com" target="_blank" rel="noopener noreferrer">sonshineroofing.com</a>.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We may collect the following personal information:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Physical address</li>
            <li>Project, referral, feedback, financing, and other lead details you submit</li>
            <li>SMS consent choices and communication preferences</li>
            <li>User behavior data collected through analytics scripts, cookies, and tracking pixels</li>
            <li>Lead attribution information, such as the page submitted from, form type, submission time,
              UTM source, UTM medium, UTM campaign, user agent, and time zone where captured</li>
            <li>Call details, call recordings, and call review notes where calls are recorded or reviewed</li>
          </ul>

          <h2>2. How We Collect It</h2>
          <p>We collect information when you:</p>
          <ul>
            <li>Fill out contact forms</li>
            <li>Submit referral, financing, feedback, special offer, or other lead forms</li>
            <li>Call us or interact with a tracked phone number</li>
            <li>Opt in to receive SMS, email, or other communications</li>
            <li>Interact with our website (via cookies and tracking pixels)</li>
            <li>Arrive from ads, search results, social media, referral links, or tagged campaigns</li>
          </ul>

          <h2>3. Tools and Third Parties</h2>
          <p>We use trusted third-party services to collect, route, store, measure, and process data:</p>
          <ul>
            <li>
              <strong>Analytics and advertising:</strong> Google Analytics, Google Tag Manager, Google Ads
              conversion tracking, and Meta/Facebook Pixel help us understand website usage, measure ad
              performance, and improve marketing.
            </li>
            <li>
              <strong>Google Ads conversion measurement:</strong> Google Ads may use cookies, conversion tags,
              and related identifiers to measure actions such as form submissions, phone calls, and other lead
              events generated from ads.
            </li>
            <li>
              <strong>Enhanced Conversions for Leads:</strong> We may send hashed first-party lead data, such as
              email address, phone number, name, or address, to Google to improve ad attribution and offline
              conversion measurement. Hashing is applied before this data is shared, but the hashed data is still
              derived from information you submitted to us.
            </li>
            <li>
              <strong>Call tracking and call review:</strong> We may use Google forwarding numbers, call reporting,
              or phone service providers to route calls, measure advertising performance, and understand which
              campaigns generated calls. SonShine Roofing or its phone providers may record and review inbound
              calls for quality, training, lead handling, customer support, and marketing attribution.
            </li>
            <li>
              <strong>Cloudflare Turnstile:</strong> We use Cloudflare Turnstile on forms to help detect bots,
              reduce spam, and protect our website and lead systems.
            </li>
            <li>
              <strong>n8n:</strong> We use n8n to route validated form leads and related attribution data to our
              internal lead workflows.
            </li>
            <li>
              <strong>NocoDB:</strong> We use NocoDB to store or queue lead records for operational routing,
              review, and follow-up.
            </li>
            <li>
              <strong>AccuLynx:</strong> We use AccuLynx to manage customer records, lead records, project
              communication, and attribution fields so we can understand which campaigns generated leads.
            </li>
          </ul>
          <p>
            These services may use cookies, pixels, scripts, call tracking technology, and other processing tools
            as described in their own privacy policies and service terms.
          </p>

          <h2>4. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Respond to inquiries and provide customer support</li>
            <li>Improve our website and services</li>
            <li>Send occasional promotional and informational content</li>
            <li>Track and analyze user behavior to optimize marketing</li>
            <li>Route, review, store, and follow up on leads and customer requests</li>
            <li>Measure website, form, phone call, and advertising performance</li>
            <li>Match submitted leads with advertising campaigns using attribution fields and hashed lead data</li>
            <li>Protect our forms and systems from spam, fraud, and automated abuse</li>
          </ul>
          <p>
            Financing-related pages and forms may help us discuss available financing options with you. Same-day
            approvals may be available. Financing subject to approval.
          </p>

          <h2>5. Data Sharing</h2>
          <p>
            We will never share your personal information with third parties for their own marketing purposes.
          </p>
          <p>
            We do not sell, rent, or trade your personal data.
          </p>
          <p>
            We may share personal information with service providers that help us operate our website, route leads,
            manage customer records, communicate with you, protect our forms from abuse, process phone calls, and
            measure advertising performance. These providers are allowed to use the information only to provide
            services to us or as otherwise permitted by their service terms and applicable law.
          </p>
          <p>
            We may disclose personal information only in the following limited situations:
          </p>
          <ul>
            <li>When required by applicable law or in response to valid law enforcement requests.</li>
            <li>In connection with a business transfer, merger, acquisition, or sale of assets.</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy,
            unless a longer retention period is required by law.
          </p>

          <h2>7. Your Rights</h2>
          <p>
            While we do not specifically target users in California or the EU, we honor reasonable requests to:
          </p>
          <ul>
            <li>Access your data</li>
            <li>Correct or delete your information</li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p>To make a request, contact us using the details below.</p>

          <h2>8. Security</h2>
          <p>
            We take security seriously. All data is protected with industry-standard security protocols. However,
            no method of transmission over the Internet is 100% secure.
          </p>

          <h2>9. Children’s Privacy</h2>
          <p>Our website is not intended for children under 13. We do not knowingly collect personal data from children.</p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with the updated
            effective date.
          </p>

          <h2>11. Contact Us</h2>
          <address className="not-italic">
            <div>SonShine Roofing Inc.</div>
            <div>2555 Porter Lake Drive Ste. 109, Sarasota, Florida, USA.</div>
            <RevealEmail
              encoded="bWFya2V0aW5nQHNvbnNoaW5lcm9vZmluZy5jb20=" 
            />
            <RevealPhone 
              e164="+19418664320"
              extension="106"
            />
          </address>
        </div>
      </div>
    </Section>
  );
}
