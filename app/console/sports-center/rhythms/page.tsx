import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge, ConsoleShell, DataTable, FormField, MetricCard, Section, SelectInput, TextInput } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { archiveRhythm, createRhythm, listRhythms } from '../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function createRhythmTemplateAction(formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const result = await createRhythm({
    organizationId: center.id,
    createdBy: session.userId,
    actorRole: session.role,
    name: text(formData, 'name'),
    category: text(formData, 'category'),
    unit: text(formData, 'unit'),
    description: text(formData, 'description') || null,
    defaultTarget: numberValue(formData, 'defaultTarget', 1),
    defaultScanAmount: numberValue(formData, 'defaultScanAmount', 1),
    isTemplate: true,
  });
  if (result.error) redirect(`/console/sports-center/rhythms?error=${encodeURIComponent(result.error)}`);
  redirect('/console/sports-center/rhythms');
}

async function archiveRhythmAction(formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const result = await archiveRhythm({
    organizationId: center.id,
    rhythmId: String(formData.get('rhythmId') ?? ''),
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/sports-center/rhythms?error=${encodeURIComponent(result.error)}`);
  redirect('/console/sports-center/rhythms');
}

export default async function RhythmTemplatesPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, rhythmsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listRhythms(center.id),
  ]);
  const templates = rhythmsResult.data.filter((rhythm) => rhythm.isTemplate);
  const activeTemplates = templates.filter((rhythm) => rhythm.status === 'active');
  const archivedTemplates = templates.filter((rhythm) => rhythm.status === 'archived');

  return (
    <ConsoleShell
      active="rhythms"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Rhythm Templates`}
      subtitle="Create, edit and archive reusable rhythm templates for member assignment."
    >
      <div className="metrics-grid">
        <MetricCard label="Templates" value={templates.length} detail={`${dashboardData.source} source`} />
        <MetricCard label="Active" value={activeTemplates.length} detail="available for assignment" tone="green" />
        <MetricCard label="Archived" value={archivedTemplates.length} detail="hidden from new assignment" tone="orange" />
        <MetricCard label="All rhythms" value={rhythmsResult.data.length} detail="templates plus assigned rhythms" tone="blue" />
      </div>

      <div className="console-grid">
        <div className="span-5">
          <Section title="Create Template" description="Templates are stored as routines with is_template=true.">
            <form action={createRhythmTemplateAction} className="stacked-form">
              <FormField label="Name">
                <TextInput name="name" required placeholder="Push-up Starter" />
              </FormField>
              <FormField label="Category">
                <SelectInput name="category" defaultValue="exercise">
                  <option value="exercise">Exercise</option>
                  <option value="wellness">Wellness</option>
                  <option value="custom">Custom</option>
                </SelectInput>
              </FormField>
              <FormField label="Unit">
                <TextInput name="unit" defaultValue="reps" required />
              </FormField>
              <FormField label="Default target">
                <TextInput name="defaultTarget" type="number" min="1" defaultValue={10} />
              </FormField>
              <FormField label="Default scan amount">
                <TextInput name="defaultScanAmount" type="number" min="1" defaultValue={10} />
              </FormField>
              <FormField label="Description">
                <TextInput name="description" placeholder="Optional coach-facing note" />
              </FormField>
              <button className="mini-button" type="submit">Create template</button>
            </form>
          </Section>
        </div>

        <div className="span-7">
          <Section title="Templates" description="Archive hides a template from new assignments without deleting history.">
            {rhythmsResult.error ? (
              <div className="alert-item">
                <strong>Live rhythm data unavailable</strong>
                <p>{rhythmsResult.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Template', 'Category', 'Target', 'Scan Amount', 'Status', 'Created', 'Actions']}
              rows={templates.map((rhythm) => [
                <strong key={`${rhythm.id}-name`}>{rhythm.name}</strong>,
                rhythm.category,
                `${rhythm.defaultTarget} ${rhythm.unit}`,
                `${rhythm.defaultScanAmount} ${rhythm.unit}`,
                <Badge key={`${rhythm.id}-status`} tone={rhythm.status === 'active' ? 'green' : 'orange'}>{rhythm.status}</Badge>,
                formatDate(rhythm.createdAt),
                rhythm.status !== 'archived' ? (
                  <div className="action-row" key={`${rhythm.id}-actions`}>
                    <Link href={`/console/sports-center/rhythms/${rhythm.id}/edit`}>Edit</Link>
                    <form action={archiveRhythmAction}>
                      <input name="rhythmId" type="hidden" value={rhythm.id} />
                      <button type="submit">Archive</button>
                    </form>
                  </div>
                ) : '-',
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
