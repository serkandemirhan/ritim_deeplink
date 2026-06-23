import { redirect } from 'next/navigation';
import { canAccessPlatformConsole, getConsoleSession } from './_auth/permissions';

export default async function ConsoleIndexPage() {
  const session = await getConsoleSession();
  redirect(canAccessPlatformConsole(session) ? '/console/platform' : '/console/sports-center');
}
