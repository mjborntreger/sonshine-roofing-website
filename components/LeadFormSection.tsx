import { Suspense } from 'react';
import { cookies } from 'next/headers';
import LeadForm from '@/components/LeadForm';
import { restoreLeadSuccessState, type LeadSuccessRestore } from '@/components/lead-form/config';
import { LeadFormFallback } from '@/components/lead-form/Fallback';

type LeadFormSectionProps = {
  initialSuccessCookie?: string | null;
  restoredSuccess?: LeadSuccessRestore | null;
};

export default async function LeadFormSection({ initialSuccessCookie, restoredSuccess }: LeadFormSectionProps = {}) {
  const cookieStore = await cookies();
  const cookieValue = initialSuccessCookie ?? cookieStore.get('ss_lead_form_success')?.value ?? null;
  const successState = restoredSuccess ?? restoreLeadSuccessState(cookieValue);

  return (
    <div>
      <Suspense fallback={<LeadFormFallback />}>
        <LeadForm initialSuccessCookie={cookieValue} restoredSuccess={successState} />
      </Suspense>
    </div>
  );
}
