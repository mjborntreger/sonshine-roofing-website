import RevealContact from './RevealContact';

type Props =
  | {
      e164: string;
      display?: string;
      smsBody?: string;
      label?: string;
      className?: string;
      linkClassName?: string;
      extension?: string | number;
      ext?: string | number;
    }
  | {
      parts: string[];
      display?: string;
      smsBody?: string;
      label?: string;
      className?: string;
      linkClassName?: string;
      extension?: string | number;
      ext?: string | number;
    }
  | {
      encoded: string;
      display?: string;
      smsBody?: string;
      label?: string;
      className?: string;
      linkClassName?: string;
      extension?: string | number;
      ext?: string | number;
    };

export default function RevealPhone(props: Props) {
  return <RevealContact variant="phone" {...(props as any)} />;
}