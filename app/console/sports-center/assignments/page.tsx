import { redirect } from 'next/navigation';
import { ConsoleShell, DataTable, FormField, MetricCard, Section, SelectInput, TextInput } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { assignNfcCard, listActivityLibraryItems, listMembers, listNfcCards, listRhythms, recordOperationalAssignment } from '../../_data/consoleRepository';
import { sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

async function assignMemberRhythmAction(formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const memberId = String(formData.get('memberId') ?? '');
  const rhythmId = String(formData.get('rhythmId') ?? '');
  const target = Number(formData.get('target') ?? 1);
  const result = await recordOperationalAssignment({
    organizationId: center.id,
    actorUserId: session.userId,
    actorRole: session.role,
    actionType: 'member_rhythm.assigned',
    targetEntityType: 'member_rhythm_assignment',
    targetEntityId: `${memberId}-${rhythmId}`,
    value: {
      memberId,
      rhythmId,
      target: Number.isFinite(target) ? target : 1,
      note: 'Assignment intent recorded. Dedicated assignment table should persist this in the schema migration.',
    },
  });
  if (result.error) redirect(`/console/sports-center/assignments?error=${encodeURIComponent(result.error)}`);
  redirect('/console/sports-center/assignments');
}

async function assignNfcCardAction(formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const result = await assignNfcCard({
    organizationId: center.id,
    tenantCardId: String(formData.get('tenantCardId') ?? ''),
    activityTypeId: String(formData.get('activityTypeId') ?? ''),
    incrementValue: Number(formData.get('incrementValue') ?? 1) || 1,
    unit: String(formData.get('unit') ?? 'custom'),
    dailyGoal: Number(formData.get('dailyGoal') ?? 0) || null,
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/sports-center/assignments?error=${encodeURIComponent(result.error)}`);
  redirect('/console/sports-center/assignments');
}

export default async function AssignmentsPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, membersResult, rhythmsResult, cardsResult, libraryResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listMembers(center.id),
    listRhythms(center.id),
    listNfcCards(center.id),
    listActivityLibraryItems(center.id),
  ]);
  const templates = rhythmsResult.data.filter((rhythm) => rhythm.isTemplate && rhythm.status === 'active');
  const unassignedCards = cardsResult.data.filter((card) => card.status === 'unassigned' || !card.activityTypeId);

  return (
    <ConsoleShell
      active="assignments"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Assignments`}
      subtitle="Assign rhythm templates to members and link NFC cards to activity library items."
    >
      <div className="metrics-grid">
        <MetricCard label="Members" value={membersResult.data.length} detail="available assignment targets" />
        <MetricCard label="Templates" value={templates.length} detail="active rhythm templates" tone="blue" />
        <MetricCard label="Unassigned cards" value={unassignedCards.length} detail="ready for NFC assignment" tone="orange" />
        <MetricCard label="Activity items" value={libraryResult.data.length} detail="library options" tone="purple" />
      </div>

      <div className="console-grid">
        <div className="span-6">
          <Section title="Assign Rhythm To Member" description="Records an audit-backed assignment intent until the dedicated assignment table is migrated.">
            <form action={assignMemberRhythmAction} className="stacked-form">
              <FormField label="Member">
                <SelectInput name="memberId" required>
                  {membersResult.data.map((member) => <option key={member.id} value={member.userId}>{member.userId}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Rhythm template">
                <SelectInput name="rhythmId" required>
                  {templates.map((rhythm) => <option key={rhythm.id} value={rhythm.id}>{rhythm.name}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Target">
                <TextInput name="target" min="1" type="number" defaultValue={1} />
              </FormField>
              <button className="mini-button" type="submit">Assign rhythm</button>
            </form>
          </Section>
        </div>

        <div className="span-6">
          <Section title="Assign NFC Card" description="Creates an active card assignment for the selected tenant NFC card.">
            <form action={assignNfcCardAction} className="stacked-form">
              <FormField label="NFC Card">
                <SelectInput name="tenantCardId" required>
                  {unassignedCards.map((card) => <option key={card.id} value={card.id}>{card.label}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Activity">
                <SelectInput name="activityTypeId" required>
                  {libraryResult.data.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Increment value">
                <TextInput name="incrementValue" min="1" type="number" defaultValue={1} />
              </FormField>
              <FormField label="Unit">
                <TextInput name="unit" defaultValue={libraryResult.data[0]?.unit ?? 'custom'} />
              </FormField>
              <FormField label="Daily goal">
                <TextInput name="dailyGoal" min="0" type="number" />
              </FormField>
              <button className="mini-button" type="submit">Assign card</button>
            </form>
          </Section>
        </div>

        <div className="span-12">
          <Section title="Assignment Readiness" description="Source data needed for operational assignment flows.">
            <DataTable
              columns={['Dataset', 'Rows', 'Error']}
              rows={[
                ['Members', membersResult.data.length, membersResult.error ?? '-'],
                ['Rhythm templates', templates.length, rhythmsResult.error ?? '-'],
                ['NFC cards', cardsResult.data.length, cardsResult.error ?? '-'],
                ['Activity library', libraryResult.data.length, libraryResult.error ?? '-'],
              ]}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
