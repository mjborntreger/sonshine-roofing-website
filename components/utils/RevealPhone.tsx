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
  if ('e164' in props) {
    const { e164, display, smsBody, label, className, linkClassName, extension, ext } = props;
    return (
      <RevealContact
        variant="phone"
        e164={e164}
        display={display}
        smsBody={smsBody}
        label={label}
        className={className}
        linkClassName={linkClassName}
        extension={extension}
        ext={ext}
      />
    );
  }

  if ('parts' in props) {
    const { parts, display, smsBody, label, className, linkClassName, extension, ext } = props;
    return (
      <RevealContact
        variant="phone"
        parts={parts}
        display={display}
        smsBody={smsBody}
        label={label}
        className={className}
        linkClassName={linkClassName}
        extension={extension}
        ext={ext}
      />
    );
  }

  const { encoded, display, smsBody, label, className, linkClassName, extension, ext } = props;
  return (
    <RevealContact
      variant="phone"
      encoded={encoded}
      display={display}
      smsBody={smsBody}
      label={label}
      className={className}
      linkClassName={linkClassName}
      extension={extension}
      ext={ext}
    />
  );
}
