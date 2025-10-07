import RevealContact from './RevealContact';

type Props =
  | { user: string; host: string; label?: string; className?: string; linkClassName?: string }
  | { encoded: string; label?: string; className?: string; linkClassName?: string };

export default function RevealEmail(props: Props) {
  if ('encoded' in props) {
    const { encoded, label, className, linkClassName } = props;
    return (
      <RevealContact
        variant="email"
        encoded={encoded}
        label={label}
        className={className}
        linkClassName={linkClassName}
      />
    );
  }

  const { user, host, label, className, linkClassName } = props;
  return (
    <RevealContact
      variant="email"
      user={user}
      host={host}
      label={label}
      className={className}
      linkClassName={linkClassName}
    />
  );
}
