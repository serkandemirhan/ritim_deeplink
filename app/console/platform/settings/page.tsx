import { redirect } from 'next/navigation';
import { ConsoleShell, FormField, Section, SelectInput, TextInput } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { getSystemSettings, upsertSystemSettings } from '../../_data/consoleRepository';
import type { SystemSettings } from '../../_types/domain';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function updateSystemSettingsAction(formData: FormData) {
  'use server';
  const session = await requireSuperAdmin();
  const result = await upsertSystemSettings({
    appName: String(formData.get('appName') ?? 'Ritim').trim(),
    supportEmail: String(formData.get('supportEmail') ?? '').trim(),
    defaultLanguage: String(formData.get('defaultLanguage') ?? 'tr') as SystemSettings['defaultLanguage'],
    maintenanceMode: String(formData.get('maintenanceMode') ?? 'false') === 'true',
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/platform/settings?error=${encodeURIComponent(result.error)}`);
  redirect('/console/platform/settings');
}

export default async function PlatformSettingsPage() {
  const session = await requireSuperAdmin();
  const settingsResult = await getSystemSettings();
  const settings = settingsResult.data;

  return (
    <ConsoleShell
      active="settings"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="System Settings"
      subtitle="Platform-level settings and feature behavior controls."
    >
      <div className="console-grid">
        <div className="span-8">
          <Section title="Global Settings" description="Reads and writes the system_settings row with id=global.">
            {settingsResult.error ? (
              <div className="alert-item">
                <strong>System settings table unavailable</strong>
                <p>{settingsResult.error} Run `apps/mobile-rn/supabase/console_settings.sql` in Supabase, then save again.</p>
              </div>
            ) : null}
            <form action={updateSystemSettingsAction} className="stacked-form">
              <FormField label="App name"><TextInput name="appName" defaultValue={settings?.appName ?? 'Ritim'} required /></FormField>
              <FormField label="Support email"><TextInput name="supportEmail" type="email" defaultValue={settings?.supportEmail ?? 'support@getritim.com'} /></FormField>
              <FormField label="Default language">
                <SelectInput name="defaultLanguage" defaultValue={settings?.defaultLanguage ?? 'tr'}><option value="tr">Turkish</option><option value="en">English</option><option value="fr">French</option></SelectInput>
              </FormField>
              <FormField label="Maintenance mode">
                <SelectInput name="maintenanceMode" defaultValue={settings?.maintenanceMode ? 'true' : 'false'}><option value="false">Off</option><option value="true">On</option></SelectInput>
              </FormField>
              <button className="mini-button" type="submit">Save settings</button>
            </form>
          </Section>
        </div>
        <div className="span-4">
          <Section title="Persistence" description="Backed by Supabase system_settings.">
            <div className="alert-item">
              <strong>{settings ? 'Live row loaded' : 'No row loaded'}</strong>
              <p>Migration file: apps/mobile-rn/supabase/console_settings.sql</p>
            </div>
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
