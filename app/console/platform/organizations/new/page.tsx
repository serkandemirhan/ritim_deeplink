import { redirect } from 'next/navigation';
import { ConsoleShell, Section } from '../../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../../_auth/permissions';
import { createOrganization } from '../../../_data/consoleRepository';
import { OrganizationForm } from '../_form';
import type { Organization } from '../../../_types/domain';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function optionalNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function createOrganizationAction(formData: FormData) {
  'use server';

  const session = await requireSuperAdmin();
  const result = await createOrganization({
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

  if (result.error || !result.data) {
    redirect(`/console/platform/organizations?error=${encodeURIComponent(result.error ?? 'Organization could not be created.')}`);
  }
  redirect(`/console/platform/organizations/${result.data.id}`);
}

export default async function NewOrganizationPage() {
  const session = await requireSuperAdmin();

  return (
    <ConsoleShell
      active="organizations"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Create Organization"
      subtitle="Create a tenant record for a gym, wellness studio, company or managed organization."
    >
      <div className="console-grid">
        <div className="span-12">
          <Section title="Organization Info" description="This writes to the tenants table through the console repository.">
            <OrganizationForm action={createOrganizationAction} submitLabel="Create organization" />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
