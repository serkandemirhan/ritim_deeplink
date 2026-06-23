import { notFound, redirect } from 'next/navigation';
import { ConsoleShell, Section } from '../../../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../../../_auth/permissions';
import { getPlatformDashboardData } from '../../../../_data/consoleDashboardData';
import { updateOrganization } from '../../../../_data/consoleRepository';
import type { Organization } from '../../../../_types/domain';
import { OrganizationForm } from '../../_form';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function optionalNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function updateOrganizationAction(organizationId: string, formData: FormData) {
  'use server';

  const session = await requireSuperAdmin();
  const result = await updateOrganization({
    organizationId,
    name: text(formData, 'name'),
    slug: text(formData, 'slug'),
    type: text(formData, 'type') as Organization['type'],
    contactEmail: text(formData, 'contactEmail'),
    city: text(formData, 'city'),
    country: text(formData, 'country'),
    status: text(formData, 'status') as Organization['status'],
    memberLimit: optionalNumber(formData, 'memberLimit'),
    nfcCardLimit: optionalNumber(formData, 'nfcCardLimit'),
    actorUserId: session.userId,
    actorRole: session.role,
  });

  if (result.error || !result.data?.[0]) {
    redirect(`/console/platform/organizations?error=${encodeURIComponent(result.error ?? 'Organization could not be updated.')}`);
  }
  redirect(`/console/platform/organizations/${organizationId}`);
}

export default async function EditOrganizationPage({ params }: PageProps) {
  const { organizationId } = await params;
  const session = await requireSuperAdmin();
  const dashboardData = await getPlatformDashboardData();
  const organization = dashboardData.organizations.find((item) => item.id === organizationId);
  if (!organization) notFound();

  const action = updateOrganizationAction.bind(null, organizationId);

  return (
    <ConsoleShell
      active="organizations"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title={`Edit ${organization.name}`}
      subtitle="Update organization profile, limits and lifecycle status."
    >
      <div className="console-grid">
        <div className="span-12">
          <Section title="Organization Info" description="This writes to the tenants table through the console repository.">
            <OrganizationForm action={action} organization={organization} submitLabel="Save organization" />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
