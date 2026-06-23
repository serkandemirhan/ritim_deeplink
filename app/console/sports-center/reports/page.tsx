import Link from 'next/link';
import { ConsoleShell, DataTable, MetricCard, Section } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { listActivityLogs, listMembers, listNfcCards } from '../../_data/consoleRepository';
import { sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

export default async function SportsCenterReportsPage() {
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, membersResult, cardsResult, logsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listMembers(center.id),
    listNfcCards(center.id),
    listActivityLogs(center.id),
  ]);

  return (
    <ConsoleShell
      active="reports"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Reports`}
      subtitle="Organization-scoped reports and CSV exports."
    >
      <div className="metrics-grid">
        <MetricCard label="Members" value={membersResult.data.length} detail="organization-scoped" />
        <MetricCard label="Cards" value={cardsResult.data.length} detail="organization-scoped" tone="purple" />
        <MetricCard label="Activity logs" value={logsResult.data.length} detail="organization-scoped" tone="blue" />
      </div>
      <div className="console-grid">
        <div className="span-12">
          <Section title="Exports" description="Exports are scoped to the active organization id.">
            <DataTable
              columns={['Dataset', 'Rows', 'Export']}
              rows={[
                ['Members', membersResult.data.length, <Link className="mini-button" key="members" href="/console/sports-center/reports/export/members">Download CSV</Link>],
                ['NFC cards', cardsResult.data.length, <Link className="mini-button" key="cards" href="/console/sports-center/reports/export/nfc-cards">Download CSV</Link>],
                ['Activity logs', logsResult.data.length, <Link className="mini-button" key="logs" href="/console/sports-center/reports/export/activity-logs">Download CSV</Link>],
              ]}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
