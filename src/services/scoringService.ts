import { supabase } from '../lib/supabase';

export interface ScoreBreakdown {
  baseScore: number;
  verificationBonus: number;
  profileCompletenessBonus: number;
  rentalHistoryBonus: number;
  totalScore: number;
  maxPossibleScore: number;
  improvements: string[];
}

export interface ScoreHistory {
  id: string;
  score_type: string;
  old_score: number;
  new_score: number;
  change_reason: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  icon: string;
  achieved_at: string;
}

export class ScoringService {
  static async calculateApplicationScore(userId: string): Promise<ScoreBreakdown> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        throw new Error('Profile not found');
      }

      let baseScore = 50;
      let verificationBonus = 0;
      let profileCompletenessBonus = 0;
      const improvements: string[] = [];

      if (profile.is_verified) {
        verificationBonus += 20;
      } else {
        improvements.push('Complétez la vérification ANSUT pour +20 points');
      }

      if (profile.oneci_verified) {
        verificationBonus += 15;
      } else {
        improvements.push('Vérifiez votre identité ONECI pour +15 points');
      }

      if (profile.cnam_verified) {
        verificationBonus += 15;
      } else {
        improvements.push('Vérifiez votre affiliation CNAM pour +15 points');
      }

      if (profile.full_name) profileCompletenessBonus += 2;
      else improvements.push('Ajoutez votre nom complet pour +2 points');

      if (profile.phone) profileCompletenessBonus += 2;
      else improvements.push('Ajoutez votre numéro de téléphone pour +2 points');

      if (profile.city) profileCompletenessBonus += 2;
      else improvements.push('Ajoutez votre ville pour +2 points');

      if (profile.bio) profileCompletenessBonus += 3;
      else improvements.push('Ajoutez une biographie pour +3 points');

      if (profile.avatar_url) profileCompletenessBonus += 3;
      else improvements.push('Ajoutez une photo de profil pour +3 points');

      if (profile.address) profileCompletenessBonus += 3;
      else improvements.push('Ajoutez votre adresse complète pour +3 points');

      const totalScore = Math.min(
        baseScore + verificationBonus + profileCompletenessBonus,
        100
      );

      return {
        baseScore,
        verificationBonus,
        profileCompletenessBonus,
        rentalHistoryBonus: 0,
        totalScore,
        maxPossibleScore: 100,
        improvements,
      };
    } catch (error) {
      console.error('Error calculating application score:', error);
      throw error;
    }
  }

  static async getTenantScore(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('user_verifications')
        .select('tenant_score')
        .eq('user_id', userId)
        .maybeSingle();

      return data?.tenant_score || 0;
    } catch (error) {
      console.error('Error getting tenant score:', error);
      return 0;
    }
  }

  static async getScoreHistory(userId: string, limit: number = 10): Promise<ScoreHistory[]> {
    try {
      const { data, error } = await supabase
        .from('score_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching score history:', error);
      return [];
    }
  }

  static async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('score_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  static async checkAndAwardAchievements(userId: string): Promise<void> {
    try {
      const score = await this.getTenantScore(userId);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) return;

      const achievements = [];

      if (score >= 70 && !await this.hasAchievement(userId, 'good_score')) {
        achievements.push({
          user_id: userId,
          achievement_type: 'score_milestone',
          achievement_name: 'Bon Score',
          achievement_description: 'Atteint un score de 70+',
          icon: '⭐',
        });
      }

      if (score >= 90 && !await this.hasAchievement(userId, 'excellent_score')) {
        achievements.push({
          user_id: userId,
          achievement_type: 'score_milestone',
          achievement_name: 'Score Excellent',
          achievement_description: 'Atteint un score de 90+',
          icon: '🌟',
        });
      }

      if (
        profile.is_verified &&
        profile.oneci_verified &&
        profile.cnam_verified &&
        !await this.hasAchievement(userId, 'fully_verified')
      ) {
        achievements.push({
          user_id: userId,
          achievement_type: 'verification',
          achievement_name: 'Entièrement Vérifié',
          achievement_description: 'Toutes les vérifications complétées',
          icon: '✅',
        });
      }

      if (achievements.length > 0) {
        await supabase.from('score_achievements').insert(achievements);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  private static async hasAchievement(userId: string, type: string): Promise<boolean> {
    const { data } = await supabase
      .from('score_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', type)
      .maybeSingle();

    return !!data;
  }

  static getScoreColor(score: number): string {
    if (score >= 80) return 'from-olive-500 to-green-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-coral-500 to-red-500';
  }

  static getScoreBadge(score: number): { text: string; color: string } {
    if (score >= 90) return { text: 'Excellent', color: 'bg-olive-100 text-olive-800 border-olive-300' };
    if (score >= 80) return { text: 'Très Bon', color: 'bg-green-100 text-green-800 border-green-300' };
    if (score >= 70) return { text: 'Bon', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
    if (score >= 60) return { text: 'Moyen', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { text: 'À Améliorer', color: 'bg-coral-100 text-coral-800 border-coral-300' };
  }

  static async recordScoreChange(
    userId: string,
    scoreType: string,
    oldScore: number,
    newScore: number,
    reason: string
  ): Promise<void> {
    try {
      await supabase.from('score_history').insert({
        user_id: userId,
        score_type: scoreType,
        old_score: oldScore,
        new_score: newScore,
        change_reason: reason,
      });
    } catch (error) {
      console.error('Error recording score change:', error);
    }
  }
}
