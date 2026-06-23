import type { PlatformUser } from './mockConsoleData';
import { listConsoleUsers } from './consoleRepository';

export type LiveConsoleUsersResult = {
  users: PlatformUser[];
  source: 'supabase';
  error?: string;
};

export async function getLivePlatformUsers(): Promise<LiveConsoleUsersResult> {
  const result = await listConsoleUsers();
  return { users: result.data, source: 'supabase', error: result.error };
}

export function splitLiveUsers(users: PlatformUser[]) {
  return {
    admins: users.filter((user) => user.platformRole !== 'user' || (user.sportsCenterRole && user.sportsCenterRole !== 'member')),
    members: users.filter((user) => user.sportsCenterRole === 'member'),
    staff: users.filter((user) => user.sportsCenterRole && user.sportsCenterRole !== 'member'),
  };
}
