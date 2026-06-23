import { notFound, redirect } from 'next/navigation';
import { ConsoleShell, FormField, Section, SelectInput, TextInput } from '../../../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../../../_auth/permissions';
import { getOrganizationDashboardData } from '../../../../_data/consoleDashboardData';
import { listRhythms, updateRhythm } from '../../../../_data/consoleRepository';
import { sportsCenters } from '../../../../_data/mockConsoleData';
import type { Rhythm } from '../../../../_types/domain';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

type PageProps = {
  params: Promise<{ rhythmId: string }>;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function updateRhythmTemplateAction(rhythmId: string, formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const result = await updateRhythm({
    rhythmId,
    organizationId: center.id,
    name: text(formData, 'name'),
    description: text(formData, 'description') || null,
    status: text(formData, 'status') as Rhythm['status'],
    defaultTarget: numberValue(formData, 'defaultTarget', 1),
    defaultScanAmount: numberValue(formData, 'defaultScanAmount', 1),
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/sports-center/rhythms?error=${encodeURIComponent(result.error)}`);
  redirect('/console/sports-center/rhythms');
}

export default async function EditRhythmTemplatePage({ params }: PageProps) {
  const { rhythmId } = await params;
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, rhythmsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listRhythms(center.id),
  ]);
  const rhythm = rhythmsResult.data.find((item) => item.id === rhythmId);
  if (!rhythm) notFound();
  const action = updateRhythmTemplateAction.bind(null, rhythmId);

  return (
    <ConsoleShell
      active="rhythms"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`Edit ${rhythm.name}`}
      subtitle={`${dashboardData.organization.name} rhythm template update form.`}
    >
      <div className="console-grid">
        <div className="span-12">
          <Section title="Template Details" description="Updates the routine template row. Archive action remains available from the templates list.">
            <form action={action} className="stacked-form">
              <FormField label="Name">
                <TextInput name="name" defaultValue={rhythm.name} required />
              </FormField>
              <FormField label="Default target">
                <TextInput name="defaultTarget" type="number" min="1" defaultValue={rhythm.defaultTarget} />
              </FormField>
              <FormField label="Default scan amount">
                <TextInput name="defaultScanAmount" type="number" min="1" defaultValue={rhythm.defaultScanAmount} />
              </FormField>
              <FormField label="Status">
                <SelectInput name="status" defaultValue={rhythm.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </SelectInput>
              </FormField>
              <FormField label="Description">
                <TextInput name="description" defaultValue={rhythm.description ?? ''} />
              </FormField>
              <button className="mini-button" type="submit">Save template</button>
            </form>
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
