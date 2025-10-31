import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const userRepository = {
  async getById(userId: string) {
    return handleQuery(supabase.from('profiles').select('*').eq('id', userId).maybeSingle());
  },

  async getByEmail(email: string) {
    return handleQuery(supabase.from('profiles').select('*').eq('email', email).maybeSingle());
  },

  async update(userId: string, updates: ProfileUpdate) {
    return handleQuery(supabase.from('profiles').update(updates).eq('id', userId).select().single());
  },

  async updateActiveRole(userId: string, role: string) {
    return handleQuery(
      supabase.from('profiles').update({ active_role: role }).eq('id', userId).select().single()
    );
  },

  async getVerificationStatus(userId: string) {
    return handleQuery(
      supabase
        .from('ansut_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
  },

  async searchUsers(query: string, userType?: string) {
    let searchQuery = supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

    if (userType) {
      searchQuery = searchQuery.eq('user_type', userType);
    }

    return handleQuery(searchQuery.order('created_at', { ascending: false }).limit(20));
  },

  async getAllUsers(userType?: string, page: number = 1, pageSize: number = 20) {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (userType) {
      query = query.eq('user_type', userType);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return handleQuery(query.order('created_at', { ascending: false }).range(from, to));
  },

  async updateProfileImage(userId: string, imageUrl: string) {
    return handleQuery(
      supabase.from('profiles').update({ profile_image: imageUrl }).eq('id', userId).select().single()
    );
  },

  async deleteUser(userId: string) {
    return handleQuery(supabase.from('profiles').delete().eq('id', userId));
  },

  async getTrustScore(userId: string) {
    const { data: profile } = await this.getById(userId);
    if (!profile) return { data: 0, error: null };

    let score = 0;
    if (profile.oneci_verified) score += 2;
    if (profile.cnam_verified) score += 1;
    if (profile.ansut_certified) score += 2;

    return { data: score, error: null };
  },
};
