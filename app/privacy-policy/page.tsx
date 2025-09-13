import Section from "@/components/layout/Section";
import RevealEmail from "@/components/RevealEmail";
import RevealPhone from "@/components/RevealPhone";
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
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_TITLE,
      description: SEO_DESC,
      images: ["/og-default.jpg"],
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
          <p><strong>Effective Date:</strong> 07/14/2025</p>
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
            <li>User behavior data (via analytics scripts)</li>
          </ul>

          <h2>2. How We Collect It</h2>
          <p>We collect information when you:</p>
          <ul>
            <li>Fill out contact forms</li>
            <li>Sign up for our newsletter</li>
            <li>Interact with our website (via cookies and tracking pixels)</li>
          </ul>

          <h2>3. Tools and Third Parties</h2>
          <p>We use trusted third-party services to collect and process data:</p>
          <ul>
            <li><strong>Google Analytics</strong> – to understand site usage and behavior.</li>
            <li><strong>Facebook Pixel</strong> – to track ad performance and user interactions.</li>
            <li><strong>Brevo</strong> – to send marketing and transactional emails.</li>
            <li><strong>AccuLynx</strong> – to manage leads and customer communications via form integration.</li>
            <li><strong>NETO</strong> – to automatically respond to inquiries and scheduling questions via SMS through an AI agent.</li>
          </ul>
          <p>These services may use cookies and other tracking technologies as per their own privacy policies.</p>

          <h2>4. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Respond to inquiries and provide customer support</li>
            <li>Improve our website and services</li>
            <li>Send occasional promotional and informational content</li>
            <li>Track and analyze user behavior to optimize marketing</li>
          </ul>

          <h2>5. Data Sharing</h2>
          <p>
            We do not sell, rent, or trade your personal data. Information may be shared only with third-party
            service providers listed above, solely for the purposes outlined.
          </p>

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

