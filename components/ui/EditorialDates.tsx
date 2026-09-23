import { cn } from '@/lib/utils';

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric',
});

export default function EditorialDates({ published, modified, className }: {
  published: string; modified?: string | null; className?: string;
}) {
  return (
    <span className={cn('inline-flex flex-wrap gap-x-4 gap-y-2', className)}>
      <span>Published <time dateTime={published}>{formatter.format(new Date(published))}</time></span>
      <span>Last modified <time dateTime={modified || published}>{formatter.format(new Date(modified || published))}</time></span>
    </span>
  );
}
