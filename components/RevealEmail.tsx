import RevealContact from './RevealContact';

type Props =
  | { user: string; host: string; label?: string; className?: string; linkClassName?: string }
  | { encoded: string; label?: string; className?: string; linkClassName?: string };

export default function RevealEmail(props: Props) {
  return <RevealContact variant="email" {...(props as any)} />;
}