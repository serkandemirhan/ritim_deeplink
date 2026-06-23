import { FormField, SelectInput, TextInput } from '../../_components/ConsoleShell';
import type { OrganizationConsoleSummary } from '../../_data/consoleDashboardData';

type OrganizationFormProps = {
  action: (formData: FormData) => Promise<void>;
  organization?: OrganizationConsoleSummary;
  submitLabel: string;
};

export function OrganizationForm({ action, organization, submitLabel }: OrganizationFormProps) {
  return (
    <form action={action} className="stacked-form">
      <div className="form-grid">
        <FormField label="Name">
          <TextInput name="name" defaultValue={organization?.name} required />
        </FormField>
        <FormField label="Slug">
          <TextInput name="slug" defaultValue={organization?.slug} required />
        </FormField>
        <FormField label="Type">
          <SelectInput name="type" defaultValue={organization?.type ?? 'wellness_center'}>
            <option value="wellness_center">Wellness Center</option>
            <option value="gym">Gym</option>
            <option value="company">Company</option>
            <option value="club">Club</option>
            <option value="institution">Institution</option>
          </SelectInput>
        </FormField>
        <FormField label="Status">
          <SelectInput name="status" defaultValue={organization?.status ?? 'active'}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </SelectInput>
        </FormField>
        <FormField label="Owner / contact email">
          <TextInput name="contactEmail" type="email" defaultValue={organization?.contactEmail} required />
        </FormField>
        <FormField label="City">
          <TextInput name="city" defaultValue={organization?.city} />
        </FormField>
        <FormField label="Country">
          <TextInput name="country" defaultValue={organization?.country} />
        </FormField>
        <FormField label="Member limit">
          <TextInput name="memberLimit" type="number" min="0" defaultValue={organization?.maxMembers ?? undefined} />
        </FormField>
        <FormField label="NFC card limit">
          <TextInput name="nfcCardLimit" type="number" min="0" defaultValue={organization?.maxNfcCards ?? undefined} />
        </FormField>
      </div>
      <div className="header-actions">
        <button className="mini-button" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
