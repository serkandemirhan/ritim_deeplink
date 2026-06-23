import { redirect } from 'next/navigation';
import { Badge, ConsoleShell, DataTable, FormField, MetricCard, Section, SelectInput, TextInput } from '../../_components/ConsoleShell';
import { requireSuperAdmin } from '../../_auth/permissions';
import { assignOrganizationSubscription, createSubscriptionPlan, listOrganizationSubscriptions, listOrganizations, listSubscriptionPlans, updateSubscriptionPlan } from '../../_data/consoleRepository';
import { formatDate } from '../../_data/mockConsoleData';
import type { OrganizationSubscription } from '../../_types/domain';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function optionalNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function createPlanAction(formData: FormData) {
  'use server';
  const session = await requireSuperAdmin();
  const result = await createSubscriptionPlan({
    code: text(formData, 'code'),
    name: text(formData, 'name'),
    description: text(formData, 'description') || null,
    memberLimit: optionalNumber(formData, 'memberLimit'),
    nfcCardLimit: optionalNumber(formData, 'nfcCardLimit') ?? 0,
    wellnessAdminLimit: optionalNumber(formData, 'wellnessAdminLimit'),
    reportLevel: text(formData, 'reportLevel') as 'basic' | 'advanced',
    supportLevel: text(formData, 'supportLevel') as 'standard' | 'priority',
    status: text(formData, 'status') as 'active' | 'inactive',
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/platform/subscriptions?error=${encodeURIComponent(result.error)}`);
  redirect('/console/platform/subscriptions');
}

async function updatePlanStatusAction(formData: FormData) {
  'use server';
  const session = await requireSuperAdmin();
  const result = await updateSubscriptionPlan({
    planId: text(formData, 'planId'),
    status: text(formData, 'status') as 'active' | 'inactive' | 'archived',
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/platform/subscriptions?error=${encodeURIComponent(result.error)}`);
  redirect('/console/platform/subscriptions');
}

async function assignSubscriptionAction(formData: FormData) {
  'use server';
  const session = await requireSuperAdmin();
  const result = await assignOrganizationSubscription({
    organizationId: text(formData, 'organizationId'),
    planId: text(formData, 'planId'),
    planCode: text(formData, 'planCode'),
    status: text(formData, 'status') as OrganizationSubscription['status'],
    provider: text(formData, 'provider') as OrganizationSubscription['provider'],
    memberLimitOverride: optionalNumber(formData, 'memberLimitOverride'),
    nfcCardLimitOverride: optionalNumber(formData, 'nfcCardLimitOverride'),
    currentPeriodEnd: text(formData, 'currentPeriodEnd') || null,
    actorUserId: session.userId,
    actorRole: session.role,
  });
  if (result.error) redirect(`/console/platform/subscriptions?error=${encodeURIComponent(result.error)}`);
  redirect('/console/platform/subscriptions');
}

export default async function PlatformSubscriptionsPage() {
  const session = await requireSuperAdmin();
  const [plansResult, orgsResult, subscriptionsResult] = await Promise.all([
    listSubscriptionPlans(),
    listOrganizations(),
    listOrganizationSubscriptions(),
  ]);
  const activePlans = plansResult.data.filter((plan) => plan.status === 'active');
  const activeSubscriptions = subscriptionsResult.data.filter((subscription) => subscription.status === 'active' || subscription.status === 'trialing');

  return (
    <ConsoleShell
      active="subscriptions"
      role="Ritim platform_admin"
      sessionRole={session.role}
      title="Subscriptions"
      subtitle="Create and manage subscription plans, then assign or override organization subscriptions."
    >
      <div className="metrics-grid">
        <MetricCard label="Plans" value={plansResult.data.length} detail={`${activePlans.length} active`} />
        <MetricCard label="Organization subscriptions" value={subscriptionsResult.data.length} detail={`${activeSubscriptions.length} active/trialing`} tone="purple" />
        <MetricCard label="Organizations" value={orgsResult.data.length} detail="available assignment targets" tone="blue" />
      </div>

      <div className="console-grid">
        <div className="span-5">
          <Section title="Create Plan" description="Writes to subscription_plans and audits the change.">
            <form action={createPlanAction} className="stacked-form">
              <FormField label="Code"><TextInput name="code" required placeholder="sports_center_basic" /></FormField>
              <FormField label="Name"><TextInput name="name" required placeholder="Sports Center Basic" /></FormField>
              <FormField label="Description"><TextInput name="description" /></FormField>
              <FormField label="Member limit"><TextInput name="memberLimit" type="number" min="0" /></FormField>
              <FormField label="NFC card limit"><TextInput name="nfcCardLimit" type="number" min="0" defaultValue={100} /></FormField>
              <FormField label="Wellness admin limit"><TextInput name="wellnessAdminLimit" type="number" min="0" /></FormField>
              <FormField label="Report level"><SelectInput name="reportLevel" defaultValue="basic"><option value="basic">Basic</option><option value="advanced">Advanced</option></SelectInput></FormField>
              <FormField label="Support level"><SelectInput name="supportLevel" defaultValue="standard"><option value="standard">Standard</option><option value="priority">Priority</option></SelectInput></FormField>
              <FormField label="Status"><SelectInput name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option></SelectInput></FormField>
              <button className="mini-button" type="submit">Create plan</button>
            </form>
          </Section>
        </div>

        <div className="span-7">
          <Section title="Plans" description="Activate, deactivate or archive plans.">
            {plansResult.error ? <div className="alert-item"><strong>Plan data unavailable</strong><p>{plansResult.error}</p></div> : null}
            <DataTable
              columns={['Plan', 'Limits', 'Reports', 'Support', 'Status', 'Created', 'Actions']}
              rows={plansResult.data.map((plan) => [
                <strong key={`${plan.id}-name`}>{plan.name}</strong>,
                `${plan.memberLimit ?? '-'} members · ${plan.nfcCardLimit} NFC`,
                plan.reportLevel,
                plan.supportLevel,
                <Badge key={`${plan.id}-status`} tone={plan.status === 'active' ? 'green' : 'orange'}>{plan.status}</Badge>,
                formatDate(plan.createdAt),
                <div className="action-row" key={`${plan.id}-actions`}>
                  <form action={updatePlanStatusAction}><input name="planId" type="hidden" value={plan.id} /><input name="status" type="hidden" value="active" /><button type="submit">Activate</button></form>
                  <form action={updatePlanStatusAction}><input name="planId" type="hidden" value={plan.id} /><input name="status" type="hidden" value="inactive" /><button type="submit">Deactivate</button></form>
                  <form action={updatePlanStatusAction}><input name="planId" type="hidden" value={plan.id} /><input name="status" type="hidden" value="archived" /><button type="submit">Archive</button></form>
                </div>,
              ])}
            />
          </Section>
        </div>

        <div className="span-5">
          <Section title="Assign Organization Subscription" description="Creates an organization subscription override row.">
            <form action={assignSubscriptionAction} className="stacked-form">
              <FormField label="Organization"><SelectInput name="organizationId">{orgsResult.data.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</SelectInput></FormField>
              <FormField label="Plan"><SelectInput name="planId">{plansResult.data.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</SelectInput></FormField>
              <FormField label="Plan code"><TextInput name="planCode" defaultValue={plansResult.data[0]?.code ?? ''} required /></FormField>
              <FormField label="Status"><SelectInput name="status" defaultValue="active"><option value="trialing">Trialing</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></SelectInput></FormField>
              <FormField label="Provider"><SelectInput name="provider" defaultValue="manual"><option value="manual">Manual</option><option value="stripe">Stripe</option><option value="apple_iap">Apple IAP</option><option value="google_play">Google Play</option></SelectInput></FormField>
              <FormField label="Member override"><TextInput name="memberLimitOverride" type="number" min="0" /></FormField>
              <FormField label="NFC override"><TextInput name="nfcCardLimitOverride" type="number" min="0" /></FormField>
              <FormField label="Period end"><TextInput name="currentPeriodEnd" type="date" /></FormField>
              <button className="mini-button" type="submit">Assign subscription</button>
            </form>
          </Section>
        </div>

        <div className="span-7">
          <Section title="Organization Subscriptions" description="Latest assigned subscriptions and overrides.">
            <DataTable
              columns={['Organization', 'Plan', 'Status', 'Provider', 'Overrides', 'Period End']}
              rows={subscriptionsResult.data.map((subscription) => [
                orgsResult.data.find((org) => org.id === subscription.organizationId)?.name ?? subscription.organizationId,
                subscription.planCode,
                <Badge key={`${subscription.id}-status`} tone={subscription.status === 'active' ? 'green' : subscription.status === 'paused' ? 'orange' : 'blue'}>{subscription.status}</Badge>,
                subscription.provider,
                `${subscription.memberLimitOverride ?? '-'} members · ${subscription.nfcCardLimitOverride ?? '-'} NFC`,
                subscription.currentPeriodEnd ?? '-',
              ])}
            />
          </Section>
        </div>
      </div>
    </ConsoleShell>
  );
}
