import { ActionRow, Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { listMembers } from '../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

export default async function SportsCenterMembersPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, membersResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listMembers(center.id),
  ]);
  const activeMembers = membersResult.data.filter((member) => member.status === 'active');
  const pendingMembers = membersResult.data.filter((member) => member.status === 'pending' || member.status === 'invited');

  return (
    <ConsoleShell
      active="members"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Members`}
      subtitle="Organization-scoped member records for the active sports center console."
    >
      <div className="metrics-grid">
        <MetricCard label="Members" value={dashboardData.activeMembersCount || membersResult.data.length} detail={`${dashboardData.source} source`} />
        <MetricCard label="Active" value={activeMembers.length} detail="active member rows" tone="green" />
        <MetricCard label="Pending / invited" value={pendingMembers.length} detail="needs admin review" tone="orange" />
        <MetricCard label="Activity logs" value={dashboardData.activityLogsCount} detail="loaded for this center" tone="blue" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Center Members" description="Scoped by active organization id; platform-only data is not mixed into this view.">
            {(dashboardData.error || membersResult.error) ? (
              <div className="alert-item">
                <strong>Live member data unavailable</strong>
                <p>{dashboardData.error ?? membersResult.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Membership', 'User ID', 'Status', 'Joined', 'Actions']}
              rows={membersResult.data.map((member) => [
                member.id,
                member.userId,
                <Badge key={`${member.id}-status`} tone={member.status === 'active' ? 'green' : 'orange'}>{member.status}</Badge>,
                formatDate(member.joinedAt ?? member.createdAt),
                <ActionRow key={`${member.id}-actions`} actions={['Profile', 'History', 'Deactivate']} />,
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
