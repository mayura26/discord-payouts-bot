import { Guild } from 'discord.js';
import { config } from '../config';

/**
 * Map a dense leaderboard place (0-based) onto a 0-based color slot index.
 * With a full board (12), uses dense slots 0–11. With fewer people, spreads
 * evenly across slots 0–10 only so nobody is forced into the last color.
 */
export function spreadSlotIndex(placeIndex: number, count: number): number {
  if (count <= 1) return 0;
  if (count >= 12) return placeIndex;
  return Math.round((placeIndex * 10) / (count - 1));
}

/** Get the role ID for a given position (1-indexed). */
export function getPositionRoleId(position: number): string {
  return config.positionRoleIds[position - 1];
}

/** Verify all 12 position roles exist in the guild. Logs warnings for missing roles. */
export async function verifyRolesExist(guild: Guild): Promise<void> {
  for (let i = 0; i < config.positionRoleIds.length; i++) {
    const roleId = config.positionRoleIds[i];
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      console.warn(`[Roles] Position ${i + 1} role (${roleId}) not found in guild. Rankings for this position will not work.`);
    }
  }
}
