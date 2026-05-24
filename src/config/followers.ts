import followersData from '../../data/followers.json'
import type { Follower } from '../types'

/**
 * Followed account configuration.
 *
 * Data source: data/followers.json
 * Update the source data instead of editing generated output by hand.
 */
export const followers: Follower[] = followersData.followers

/**
 * Get all followed usernames.
 */
export function getFollowerUsernames(): string[] {
  return followers.map(f => f.username)
}
