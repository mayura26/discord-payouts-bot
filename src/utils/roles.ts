import { Guild } from 'discord.js';
import { config } from '../config';

/** Get the role ID for a given position (1-indexed). */
export function getPositionRoleId(position: number): string {
  return config.positionRoleIds[position - 1];
}

/** Verify all 10 position roles exist in the guild. Logs warnings for missing roles. */
export async function verifyRolesExist(guild: Guild): Promise<void> {
  for (let i = 0; i < config.positionRoleIds.length; i++) {
    const roleId = config.positionRoleIds[i];
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      console.warn(`[Roles] Position ${i + 1} role (${roleId}) not found in guild. Rankings for this position will not work.`);
    }
  }
}
