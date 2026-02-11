import { Guild } from 'discord.js';
import { config } from '../config';
import { getTopUsers } from '../database/payouts';

let rankingInProgress = false;
let rankingQueued = false;

/**
 * Trigger a ranking recalculation. If one is already in progress,
 * queues another run for when the current one finishes.
 */
export async function triggerRankingRecalculation(guild: Guild): Promise<void> {
  if (rankingInProgress) {
    rankingQueued = true;
    return;
  }

  rankingInProgress = true;
  try {
    await recalculateRankings(guild);
  } catch (error) {
    console.error('[Ranking] Recalculation failed:', error);
  } finally {
    rankingInProgress = false;
    if (rankingQueued) {
      rankingQueued = false;
      await triggerRankingRecalculation(guild);
    }
  }
}

async function recalculateRankings(guild: Guild): Promise<void> {
  const topUsers = getTopUsers(guild.id, 12);

  // Map of userId -> desired role ID
  const desiredRoles = new Map<string, string>();
  for (let i = 0; i < topUsers.length; i++) {
    desiredRoles.set(topUsers[i].user_id, config.positionRoleIds[i]);
  }

  const allPositionRoleIds = new Set(config.positionRoleIds);

  // Find all members who currently hold any position role
  const currentHolders = new Map<string, Set<string>>();

  for (const roleId of config.positionRoleIds) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;

    for (const [memberId] of role.members) {
      if (!currentHolders.has(memberId)) {
        currentHolders.set(memberId, new Set());
      }
      currentHolders.get(memberId)!.add(roleId);
    }
  }

  // Determine changes needed
  const roleChanges: Array<{
    userId: string;
    add: string[];
    remove: string[];
  }> = [];

  // Users who SHOULD have a position role
  for (const [userId, desiredRoleId] of desiredRoles) {
    const currentRoles = currentHolders.get(userId) ?? new Set();
    const toAdd = currentRoles.has(desiredRoleId) ? [] : [desiredRoleId];
    const toRemove = [...currentRoles].filter(r => r !== desiredRoleId);

    if (toAdd.length > 0 || toRemove.length > 0) {
      roleChanges.push({ userId, add: toAdd, remove: toRemove });
    }
    currentHolders.delete(userId);
  }

  // Users who should NOT have any position role (no longer in top 12)
  for (const [userId, currentRoles] of currentHolders) {
    if (currentRoles.size > 0) {
      roleChanges.push({ userId, add: [], remove: [...currentRoles] });
    }
  }

  // Apply changes
  for (const change of roleChanges) {
    try {
      const member = await guild.members.fetch(change.userId);
      for (const roleId of change.remove) {
        await member.roles.remove(roleId);
      }
      for (const roleId of change.add) {
        await member.roles.add(roleId);
      }
    } catch (error) {
      // Member may have left the server
      console.error(`[Ranking] Failed to update roles for user ${change.userId}:`, error);
    }
  }

  console.log(`[Ranking] Recalculation complete. ${roleChanges.length} role change(s) applied.`);
}
