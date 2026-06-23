import { Badge, ConsoleShell, DataTable, FilterBar, FilterSelect, MetricCard, SearchBar, Section } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { listActivityLogs } from '../../_data/consoleRepository';
import { formatDate, sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    source?: string;
  }>;
};

export default async function ActivityLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await requireOrganizationAccess(center.id);
  const [dashboardData, logsResult] = await Promise.all([
    getOrganizationDashboardData(center.id),
    listActivityLogs(center.id),
  ]);
  const query = params?.q?.trim().toLowerCase() ?? '';
  const sourceFilter = params?.source ?? 'all';
  const filteredLogs = logsResult.data.filter((log) => {
    const matchesQuery = !query || log.userId.toLowerCase().includes(query) || log.activityType.toLowerCase().includes(query);
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    return matchesQuery && matchesSource;
  });
  const nfcLogs = logsResult.data.filter((log) => log.source === 'nfc');
  const manualLogs = logsResult.data.filter((log) => log.source === 'manual' || log.source === 'admin');

  return (
    <ConsoleShell
      active="activity-logs"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Activity Logs`}
      subtitle="Organization-scoped card scan history and manual/admin activity logs."
    >
      <div className="metrics-grid">
        <MetricCard label="Logs" value={logsResult.data.length} detail={`${dashboardData.source} source`} />
        <MetricCard label="NFC verified" value={nfcLogs.length} detail="scan-backed rows" tone="green" />
        <MetricCard label="Manual/Admin" value={manualLogs.length} detail="not NFC verified" tone="blue" />
        <MetricCard label="Filtered" value={filteredLogs.length} detail="current result" tone="purple" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Scan & Activity History" description="Filter by member, activity type or verification source.">
            {logsResult.error ? (
              <div className="alert-item">
                <strong>Live activity data unavailable</strong>
                <p>{logsResult.error}</p>
              </div>
            ) : null}
            <form action="/console/sports-center/activity-logs" className="stacked-form">
              <FilterBar>
                <SearchBar name="q" placeholder="Search user or activity" defaultValue={params?.q} />
                <FilterSelect
                  label="Source"
                  name="source"
                  defaultValue={sourceFilter}
                  options={[
                    { label: 'All sources', value: 'all' },
                    { label: 'NFC verified', value: 'nfc' },
                    { label: 'Manual', value: 'manual' },
                    { label: 'Admin', value: 'admin' },
                    { label: 'Import', value: 'import' },
                  ]}
                />
                <button className="mini-button" type="submit">Apply</button>
              </FilterBar>
            </form>
            <DataTable
              columns={['Time', 'User', 'Activity', 'Amount', 'Source', 'Card', 'Note']}
              rows={filteredLogs.map((log) => [
                formatDate(log.createdAt),
                log.userId,
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
