import Section from "@/components/layout/Section";
import RevealEmail from "@/components/utils/RevealEmail";
import RevealPhone from "@/components/utils/RevealPhone";
import type { Metadata } from "next";
import Link from "next/link";

const SEO_TITLE = "SMS Terms and Conditions | SonShine Roofing";
const SEO_DESC = "Terms and conditions for SMS and MMS communications from SonShine Roofing.";
const CANONICAL = "/sms-terms-and-conditions";

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

export const revalidate = 86400;

export default function SmsTermsAndConditionsPage() {
  return (
    <Section>
      <div className="container-edge py-10">
        <div className="prose">
          <h1>SMS Terms and Conditions</h1>
          <p><strong>Effective Date:</strong> 03/12/2026</p>

          <h2>Program Description</h2>
          <p>
            When opted-in, you will receive text messages (SMS/MMS) to your mobile number.
            These kinds of messages may include responses to quotes, estimates, or service
            inquiries; real-time texts to ask and answer questions about our services and
            pricing; appointment scheduling and confirmations; feedback requests; project
            updates; and/or follow-ups.
          </p>

          <h2>Program Frequency</h2>
          <p>You can expect to receive 5-10 messages per month from us.</p>

          <h2>Opt Out</h2>
          <p>
            You can opt out of this service at any time. Just text &quot;STOP&quot; to the phone number.
            After you text &quot;STOP&quot; to us, we will send you an SMS reply to confirm that you have
            been unsubscribed. After this, you will no longer receive SMS messages from us. If
            you want to join again, just sign up as you did the first time or text &quot;START,&quot; and
            we will start sending SMS messages to you again.
          </p>

          <h2>Help</h2>
          <p>
            If you are experiencing any issues, you can reply with the keyword HELP. Or, you can
            request help directly from us at{" "}
            <RevealPhone e164="+19418664320" extension="106" />
            {" "}or{" "}
            <RevealEmail encoded="bWFya2V0aW5nQHNvbnNoaW5lcm9vZmluZy5jb20=" />.
          </p>

          <h2>Costs</h2>
          <p>
            Message and data rates may apply for any messages sent to you from us and to us from
            you. If you have any questions about your text plan or data plan, please contact your
            wireless provider.
          </p>

          <h2>Privacy</h2>
          <p>
            If you have any questions regarding privacy, please read our{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </Section>
  );
}
