import { Badge, ConsoleShell, DataTable, FilterBar, FilterSelect, MetricCard, SearchBar, Section } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { listAuditLogs } from '../../_data/consoleRepository';
import { formatDate } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function PlatformAuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await requireSuperAdmin();
  const result = await listAuditLogs();
  const query = params?.q?.trim().toLowerCase() ?? '';
  const status = params?.status ?? 'all';
  const filtered = result.data.filter((log) => {
    const matchesQuery = !query
      || log.actorUserId.toLowerCase().includes(query)
      || log.actionType.toLowerCase().includes(query)
      || log.targetEntityType.toLowerCase().includes(query)
      || log.targetEntityId.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || log.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <ConsoleShell
      active="audit-logs"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Audit Logs"
      subtitle="Platform-wide audit trail for sensitive console actions."
    >
      <div className="metrics-grid">
        <MetricCard label="Audit rows" value={result.data.length} detail="all organizations" />
        <MetricCard label="Filtered" value={filtered.length} detail="current result" tone="blue" />
        <MetricCard label="Failed" value={result.data.filter((log) => log.status === 'failed').length} detail="requires review" tone="orange" />
      </div>
      <div className="console-grid">
        <div className="span-12">
          <Section title="Audit Trail" description="Search actor, action or target.">
            {result.error ? <div className="alert-item"><strong>Audit data unavailable</strong><p>{result.error}</p></div> : null}
            <form action="/console/platform/audit-logs" className="stacked-form">
              <FilterBar>
                <SearchBar name="q" placeholder="Search audit logs" defaultValue={params?.q} />
                <FilterSelect label="Status" name="status" defaultValue={status} options={[{ label: 'All', value: 'all' }, { label: 'Success', value: 'success' }, { label: 'Failed', value: 'failed' }]} />
                <button className="mini-button" type="submit">Apply</button>
              </FilterBar>
            </form>
            <DataTable
              columns={['Time', 'Actor', 'Role', 'Organization', 'Action', 'Target', 'Status']}
              rows={filtered.map((log) => [
                formatDate(log.createdAt),
                log.actorUserId,
                log.actorRole,
                log.organizationId ?? 'platform',
                log.actionType,
                `${log.targetEntityType}:${log.targetEntityId}`,
                <Badge key={`${log.id}-status`} tone={log.status === 'success' ? 'green' : 'red'}>{log.status}</Badge>,
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
