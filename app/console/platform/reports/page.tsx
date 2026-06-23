import Link from 'next/link';
import { ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { getPlatformDashboardData } from '../../_data/consoleDashboardData';
import { listActivityLogs, listMembers, listNfcCards } from '../../_data/consoleRepository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlatformReportsPage() {
  const session = await requireSuperAdmin();
  const [dashboardData, membersResult, cardsResult, logsResult] = await Promise.all([
    getPlatformDashboardData(),
    listMembers(),
    listNfcCards(),
    listActivityLogs(),
  ]);
  const activeMembers = membersResult.data.filter((member) => member.status === 'active');
  const assignedCards = cardsResult.data.filter((card) => card.status === 'assigned' || card.assignedMemberId);
  const nfcLogs = logsResult.data.filter((log) => log.source === 'nfc');

  return (
    <ConsoleShell
      active="reports"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Platform Reports"
      subtitle="Cross-organization usage, card and activity reporting with CSV exports."
    >
      <div className="metrics-grid">
        <MetricCard label="Organizations" value={dashboardData.organizations.length} detail={`${dashboardData.source} source`} />
        <MetricCard label="Active members" value={activeMembers.length} detail="all organizations" tone="green" />
        <MetricCard label="Assigned cards" value={assignedCards.length} detail={`${cardsResult.data.length} total`} tone="purple" />
        <MetricCard label="NFC logs" value={nfcLogs.length} detail={`${logsResult.data.length} total logs`} tone="blue" />
      </div>
      <div className="console-grid">
        <div className="span-12">
          <Section title="Exports" description="CSV exports use the same server repository queries as the console pages.">
            <DataTable
              columns={['Dataset', 'Rows', 'Export']}
              rows={[
                ['Members', membersResult.data.length, <Link className="mini-button" key="members" href="/console/platform/reports/export/members">Download CSV</Link>],
                ['NFC cards', cardsResult.data.length, <Link className="mini-button" key="cards" href="/console/platform/reports/export/nfc-cards">Download CSV</Link>],
                ['Activity logs', logsResult.data.length, <Link className="mini-button" key="logs" href="/console/platform/reports/export/activity-logs">Download CSV</Link>],
                ['Organizations', dashboardData.organizations.length, <Link className="mini-button" key="orgs" href="/console/platform/reports/export/organizations">Download CSV</Link>],
              ]}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
