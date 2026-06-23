import { redirect } from 'next/navigation';
import { ConsoleShell, FormField, Section, SelectInput, TextInput } from '../../_components/ConsoleShell';
import { requireOrganizationAccess } from '../../_auth/permissions';
import { getOrganizationDashboardData } from '../../_data/consoleDashboardData';
import { recordOperationalAssignment } from '../../_data/consoleRepository';
import { sportsCenters } from '../../_data/mockConsoleData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const center = sportsCenters.find((item) => item.id === 'sc-lyon-fit') ?? sportsCenters[0];

async function updateOrganizationSettingsAction(formData: FormData) {
  'use server';

  const session = await requireOrganizationAccess(center.id);
  const result = await recordOperationalAssignment({
    organizationId: center.id,
    actorUserId: session.userId,
    actorRole: session.role,
    actionType: 'settings.updated',
    targetEntityType: 'organization_settings',
    targetEntityId: center.id,
    value: {
      contactEmail: String(formData.get('contactEmail') ?? '').trim(),
      defaultLanguage: String(formData.get('defaultLanguage') ?? 'tr'),
      memberApprovalMode: String(formData.get('memberApprovalMode') ?? 'manual'),
      nfcScanBehavior: String(formData.get('nfcScanBehavior') ?? 'member_required'),
      note: 'Settings intent recorded. Dedicated organization_settings mutation should persist this after schema migration.',
    },
  });
  if (result.error) redirect(`/console/sports-center/settings?error=${encodeURIComponent(result.error)}`);
  redirect('/console/sports-center/settings');
}

export default async function OrganizationSettingsPage() {
  const session = await requireOrganizationAccess(center.id);
  const dashboardData = await getOrganizationDashboardData(center.id);

  return (
    <ConsoleShell
      active="settings"
      role="Sports center owner/admin/coach"
      sessionRole={session.role}
      title={`${dashboardData.organization.name} Settings`}
      subtitle="Organization-level behavior settings for member approval and NFC scan handling."
    >
      <div className="console-grid">
        <div className="span-8">
          <Section title="Organization Settings" description="Until organization_settings migration lands, saves are recorded through audit as operational intent.">
            <form action={updateOrganizationSettingsAction} className="stacked-form">
              <FormField label="Contact email">
                <TextInput name="contactEmail" type="email" defaultValue={dashboardData.organization.contactEmail} />
              </FormField>
              <FormField label="Default language">
                <SelectInput name="defaultLanguage" defaultValue="tr">
                  <option value="tr">Turkish</option>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                </SelectInput>
              </FormField>
              <FormField label="Member approval mode">
                <SelectInput name="memberApprovalMode" defaultValue="manual">
                  <option value="manual">Manual approval</option>
                  <option value="automatic">Automatic approval</option>
                </SelectInput>
              </FormField>
              <FormField label="NFC scan behavior">
                <SelectInput name="nfcScanBehavior" defaultValue="member_required">
                  <option value="member_required">Require approved member</option>
                  <option value="create_join_request">Create join request for unknown member</option>
                </SelectInput>
              </FormField>
              <button className="mini-button" type="submit">Save settings intent</button>
            </form>
          </Section>
        </div>

        <div className="span-4">
          <Section title="Limits" description="Member/card creation checks use these limits before writes.">
            <div className="alert-list">
              <div className="alert-item">
                <strong>Members</strong>
                <p>{dashboardData.organization.membersCount} / {dashboardData.organization.maxMembers ?? '-'}</p>
              </div>
              <div className="alert-item">
                <strong>NFC Cards</strong>
                <p>{dashboardData.organization.nfcCardsCount} / {dashboardData.organization.maxNfcCards ?? '-'}</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
