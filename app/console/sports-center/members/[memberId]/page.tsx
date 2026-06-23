import { notFound } from 'next/navigation';
import { Badge, ConsoleShell, DataTable, MetricCard, Section } from '../../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../../_auth/permissions';
import { getOrganizationDashboardData } from '../../../_data/consoleDashboardData';
import { listActivityLogs, listMembers } from '../../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

type PageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function MemberProgressPage({ params }: PageProps) {
  const { memberId } = await params;
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, membersResult, logsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listMembers(center.id),
    listActivityLogs(center.id),
  ]);
  const member = membersResult.data.find((item) => item.userId === decodeURIComponent(memberId) || item.id === decodeURIComponent(memberId));
  if (!member) notFound();

  const memberLogs = logsResult.data.filter((log) => log.userId === member.userId);
  const nfcLogs = memberLogs.filter((log) => log.source === 'nfc');
  const totalAmount = memberLogs.reduce((sum, log) => sum + log.amount, 0);
  const activityTypes = new Set(memberLogs.map((log) => log.activityType));

  return (
    <ConsoleShell
      active="members"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Member Progress`}
      subtitle="Member detail and activity progress scoped to the active organization."
    >
      <div className="metrics-grid">
        <MetricCard label="Logs" value={memberLogs.length} detail="all tracked activity rows" />
        <MetricCard label="NFC verified" value={nfcLogs.length} detail="scan-backed progress" tone="green" />
        <MetricCard label="Activity types" value={activityTypes.size} detail="distinct tracked actions" tone="blue" />
        <MetricCard label="Total amount" value={totalAmount} detail="mixed units; detailed table below" tone="purple" />
      </div>

      <div className="console-grid">
        <div className="span-5">
          <Section title="Member" description="Membership record from tenant_members.">
            <DataTable
              columns={['Field', 'Value']}
              rows={[
                ['Membership ID', member.id],
                ['User ID', member.userId],
                ['Status', <Badge key="status" tone={member.status === 'active' ? 'green' : 'orange'}>{member.status}</Badge>],
                ['Joined', formatDate(member.joinedAt ?? member.createdAt)],
                ['Created by', member.createdBy ?? '-'],
              ]}
            />
          </Section>
        </div>

        <div className="span-7">
          <Section title="Progress History" description="Latest activity rows for this member only.">
            {logsResult.error ? (
              <div className="alert-item">
                <strong>Live progress data unavailable</strong>
                <p>{logsResult.error}</p>
              </div>
            ) : null}
            <DataTable
              columns={['Time', 'Activity', 'Amount', 'Source', 'Card', 'Note']}
              rows={memberLogs.map((log) => [
                formatDate(log.createdAt),
                log.activityType,
                `${log.amount} ${log.unit}`,
                <Badge key={`${log.id}-source`} tone={log.source === 'nfc' ? 'green' : 'blue'}>{log.source}</Badge>,
                log.nfcCardId ?? '-',
                log.note ?? '-',
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
