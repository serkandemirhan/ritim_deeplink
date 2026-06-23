import Link from 'next/link';
import { ActionRow, Badge, ConsoleShell, DataTable, FilterBar, FilterSelect, MetricCard, SearchBar, Section, UsageBar } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { getPlatformDashboardData } from '../../_data/consoleDashboardData';
import { formatDate, isNearLimit } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    plan?: string;
    page?: string;
  }>;
};

const pageSize = 10;

function statusTone(status: string): 'green' | 'blue' | 'orange' | 'red' {
  if (status === 'active') return 'green';
  if (status === 'trialing') return 'blue';
  if (status === 'paused' || status === 'suspended') return 'orange';
  return 'red';
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const session = await requireSuperAdmin();
  const params = await searchParams;
  const query = params?.q?.trim().toLowerCase() ?? '';
  const statusFilter = params?.status ?? 'all';
  const planFilter = params?.plan ?? 'all';
  const currentPage = Math.max(1, Number(params?.page ?? 1) || 1);
  const dashboardData = await getPlatformDashboardData();

  const filteredOrganizations = dashboardData.organizations.filter((organization) => {
    const matchesQuery = !query
      || organization.name.toLowerCase().includes(query)
      || organization.slug.toLowerCase().includes(query)
      || organization.contactEmail.toLowerCase().includes(query)
      || organization.city.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || organization.status === statusFilter || organization.subscriptionStatus === statusFilter;
    const matchesPlan = planFilter === 'all' || organization.planCode === planFilter;
    return matchesQuery && matchesStatus && matchesPlan;
  });

  const pageCount = Math.max(1, Math.ceil(filteredOrganizations.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageOrganizations = filteredOrganizations.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = dashboardData.organizations.filter((organization) => organization.status === 'active').length;
  const nearLimitCount = dashboardData.organizations.filter((organization) => (
    isNearLimit(organization.membersCount, organization.maxMembers) || isNearLimit(organization.nfcCardsCount, organization.maxNfcCards)
  )).length;
  const planOptions = Array.from(new Set(dashboardData.organizations.map((organization) => organization.planCode).filter(Boolean)));

  return (
    <ConsoleShell
      active="organizations"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Organizations"
      subtitle="Platform-wide tenant list with subscription, usage and operational status."
      actions={<Link className="mini-button" href="/console/platform/organizations/new">Create organization</Link>}
    >
      <div className="metrics-grid">
        <MetricCard label="Organizations" value={dashboardData.organizations.length} detail={`${dashboardData.source} data source`} />
        <MetricCard label="Active" value={activeCount} detail="Available to center admins" tone="green" />
        <MetricCard label="Near limits" value={nearLimitCount} detail="Members or NFC usage >= 80%" tone="orange" />
        <MetricCard label="Filtered" value={filteredOrganizations.length} detail="Current search result" tone="blue" />
      </div>

      <div className="console-grid">
        <div className="span-12">
          <Section title="Organization Directory" description="Search by name, slug, owner email or city. Filters are applied server-side.">
            {dashboardData.error ? (
              <div className="alert-item">
                <strong>Live organization fallback</strong>
                <p>{dashboardData.error} Showing available fallback data until Supabase console tables are ready.</p>
              </div>
            ) : null}
            <form action="/console/platform/organizations" className="stacked-form">
              <FilterBar>
                <SearchBar name="q" placeholder="Search organizations" defaultValue={params?.q} />
                <FilterSelect
                  label="Status"
                  name="status"
                  defaultValue={statusFilter}
                  options={[
                    { label: 'All statuses', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Trialing', value: 'trialing' },
                    { label: 'Paused', value: 'paused' },
                    { label: 'Suspended', value: 'suspended' },
                    { label: 'Archived', value: 'archived' },
                  ]}
                />
                <FilterSelect
                  label="Plan"
                  name="plan"
                  defaultValue={planFilter}
                  options={[
                    { label: 'All plans', value: 'all' },
                    ...planOptions.map((plan) => ({ label: plan, value: plan })),
                  ]}
                />
                <button className="mini-button" type="submit">Apply</button>
              </FilterBar>
            </form>
            <DataTable
              columns={['Organization', 'Owner Email', 'Plan', 'Status', 'Members', 'NFC Cards', 'City', 'Last Activity', 'Actions']}
              rows={pageOrganizations.map((organization) => [
                <strong key={`${organization.id}-name`}>{organization.name}</strong>,
                organization.contactEmail || '-',
                organization.planCode,
                <Badge key={`${organization.id}-status`} tone={statusTone(organization.status)}>{organization.status}</Badge>,
                <UsageBar key={`${organization.id}-members`} label="Members" current={organization.membersCount} max={organization.maxMembers} />,
                <UsageBar key={`${organization.id}-cards`} label="NFC" current={organization.nfcCardsCount} max={organization.maxNfcCards} />,
                `${organization.city || '-'} / ${organization.country || '-'}`,
                formatDate(organization.lastActivityAt),
                <ActionRow key={`${organization.id}-actions`} actions={['View', 'Edit', 'Subscription']} />,
              ])}
              pagination={{ page: safePage, pageCount, totalItems: filteredOrganizations.length }}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
