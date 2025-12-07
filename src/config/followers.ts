import type { Follower } from '../types';
import followersData from '../../data/followers.json';

/**
 * 关注者列表配置
 *
 * 数据源: data/followers.json
 * 可以直接在 GitHub Web UI 编辑此文件来更新关注者列表
 */
export const followers: Follower[] = followersData.followers;

/**
 * 获取所有关注者用户名
 */
export function getFollowerUsernames(): string[] {
  return followers.map((f) => f.username);
}
