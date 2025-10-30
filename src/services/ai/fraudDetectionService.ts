import { supabase } from '../../lib/supabase';
import { azureAIService } from './azureAIService';

interface FraudRiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  shouldAlert: boolean;
}

interface UserProfile {
  id: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  oneci_verified: boolean;
  cnam_verified: boolean;
  face_verified: boolean;
}

export class FraudDetectionService {
  static async assessUserRisk(userId: string): Promise<FraudRiskAssessment> {
    try {
      let riskScore = 0;
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        return this.createHighRiskAssessment([
          'Profil utilisateur introuvable',
        ]);
      }

      const accountAge = this.getAccountAgeDays(profile.created_at);
      if (accountAge < 1) {
        riskScore += 25;
        riskFactors.push('Compte créé très récemment (moins de 24h)');
        recommendations.push('Vérifier l\'identité avant toute transaction');
      } else if (accountAge < 7) {
        riskScore += 15;
        riskFactors.push('Compte récent (moins de 7 jours)');
      }

      if (!profile.full_name) {
        riskScore += 10;
        riskFactors.push('Nom complet manquant');
        recommendations.push('Demander de compléter le profil');
      }

      if (!profile.phone) {
        riskScore += 10;
        riskFactors.push('Numéro de téléphone manquant');
      }

      if (!profile.avatar_url) {
        riskScore += 5;
        riskFactors.push('Photo de profil manquante');
      }

      if (!profile.oneci_verified) {
        riskScore += 15;
        riskFactors.push('Identité ONECI non vérifiée');
        recommendations.push('Exiger la vérification ONECI');
      }

      if (!profile.cnam_verified) {
        riskScore += 10;
        riskFactors.push('Affiliation CNAM non vérifiée');
      }

      if (!profile.face_verified) {
        riskScore += 10;
        riskFactors.push('Vérification faciale non effectuée');
      }

      const activityRisk = await this.assessActivityPattern(userId);
      riskScore += activityRisk.score;
      riskFactors.push(...activityRisk.factors);

      const messageRisk = await this.assessMessagePattern(userId);
      riskScore += messageRisk.score;
      riskFactors.push(...messageRisk.factors);

      const riskLevel = this.calculateRiskLevel(riskScore);

      const shouldAlert = riskLevel === 'high' || riskLevel === 'critical';

      if (shouldAlert) {
        await this.createFraudAlert(userId, riskScore, riskFactors);
      }

      await azureAIService.logUsage(userId, {
        service_type: 'fraud_detection',
        operation: 'assess_user_risk',
        tokens_used: 0,
        cost_fcfa: 0.3,
        success: true,
        metadata: {
          risk_score: riskScore,
          risk_level: riskLevel,
        },
      });

      return {
        riskScore,
        riskLevel,
        riskFactors,
        recommendations,
        shouldAlert,
      };
    } catch (error) {
      console.error('Error assessing user risk:', error);
      return this.createMediumRiskAssessment([
        'Erreur lors de l\'évaluation du risque',
      ]);
    }
  }

  private static async assessActivityPattern(
    userId: string
  ): Promise<{ score: number; factors: string[] }> {
    let score = 0;
    const factors: string[] = [];

    try {
      const { data: activities } = await supabase
        .from('user_activity_tracking')
        .select('action_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!activities) return { score: 0, factors: [] };

      const activityCount = activities.length;

      if (activityCount > 100) {
        score += 20;
        factors.push(`Activité anormalement élevée (${activityCount} actions en 24h)`);
      } else if (activityCount > 50) {
        score += 10;
        factors.push(`Activité très élevée (${activityCount} actions en 24h)`);
      }

      const messageCount = activities.filter(
        (a) => a.action_type === 'message'
      ).length;

      if (messageCount > 30) {
        score += 15;
        factors.push(
          `Nombre suspect de messages (${messageCount} messages en 24h)`
        );
      }

      const viewCount = activities.filter(
        (a) => a.action_type === 'view'
      ).length;

      if (viewCount > 50) {
        score += 10;
        factors.push(
          `Nombre élevé de consultations (${viewCount} vues en 24h)`
        );
      }
    } catch (error) {
      console.error('Error assessing activity pattern:', error);
    }

    return { score, factors };
  }

  private static async assessMessagePattern(
    userId: string
  ): Promise<{ score: number; factors: string[] }> {
    let score = 0;
    const factors: string[] = [];

    try {
      const { data: messages } = await supabase
        .from('chatbot_messages')
        .select('content')
        .eq('role', 'user')
        .limit(10);

      if (!messages || messages.length === 0) {
        return { score: 0, factors: [] };
      }

      const contents = messages.map((m) => m.content);
      const uniqueMessages = new Set(contents);

      if (uniqueMessages.size < contents.length * 0.3) {
        score += 15;
        factors.push('Messages répétitifs détectés (copier-coller suspect)');
      }

      const suspiciousKeywords = [
        'urgent',
        'rapidement',
        'espèces',
        'western union',
        'transfert',
        'avance',
        'garantie',
      ];

      const messagesToCheck = contents.join(' ').toLowerCase();
      const foundKeywords = suspiciousKeywords.filter((keyword) =>
        messagesToCheck.includes(keyword)
      );

      if (foundKeywords.length >= 3) {
        score += 10;
        factors.push(
          `Mots-clés suspects détectés: ${foundKeywords.join(', ')}`
        );
      }
    } catch (error) {
      console.error('Error assessing message pattern:', error);
    }

    return { score, factors };
  }

  private static getAccountAgeDays(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static calculateRiskLevel(
    riskScore: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  private static async createFraudAlert(
    userId: string,
    riskScore: number,
    riskFactors: string[]
  ): Promise<void> {
    try {
      await supabase.from('fraud_detection_alerts').insert({
        user_id: userId,
        alert_type: riskScore >= 70 ? 'identity_theft' : 'suspicious_listing',
        risk_score: riskScore,
        risk_factors: riskFactors,
        status: 'new',
      });
    } catch (error) {
      console.error('Error creating fraud alert:', error);
    }
  }

  private static createHighRiskAssessment(
    factors: string[]
  ): FraudRiskAssessment {
    return {
      riskScore: 85,
      riskLevel: 'critical',
      riskFactors: factors,
      recommendations: [
        'Bloquer temporairement l\'accès',
        'Vérifier manuellement l\'identité',
        'Contacter l\'utilisateur par téléphone',
      ],
      shouldAlert: true,
    };
  }

  private static createMediumRiskAssessment(
    factors: string[]
  ): FraudRiskAssessment {
    return {
      riskScore: 50,
      riskLevel: 'medium',
      riskFactors: factors,
      recommendations: [
        'Surveiller l\'activité de près',
        'Demander des vérifications supplémentaires',
      ],
      shouldAlert: false,
    };
  }

  static async checkPropertyListing(
    propertyId: string,
    ownerId: string
  ): Promise<FraudRiskAssessment> {
    try {
      let riskScore = 0;
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      const { data: property } = await supabase
        .from('properties')
        .select('*, profiles!inner(*)')
        .eq('id', propertyId)
        .maybeSingle();

      if (!property) {
        return this.createHighRiskAssessment(['Propriété introuvable']);
      }

      if (!property.images || property.images.length === 0) {
        riskScore += 20;
        riskFactors.push('Aucune photo fournie');
        recommendations.push('Exiger au moins 3 photos de qualité');
      } else if (property.images.length < 3) {
        riskScore += 10;
        riskFactors.push('Nombre insuffisant de photos');
      }

      if (!property.description || property.description.length < 50) {
        riskScore += 15;
        riskFactors.push('Description trop courte ou manquante');
        recommendations.push('Demander une description détaillée');
      }

      if (property.monthly_rent < 20000) {
        riskScore += 15;
        riskFactors.push('Prix anormalement bas pour le marché');
        recommendations.push('Vérifier la légitimité du prix');
      }

      const { data: ownerProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId);

      const propertiesCount = ownerProperties?.length || 0;

      if (propertiesCount > 20) {
        riskScore += 10;
        riskFactors.push(
          `Nombre très élevé de propriétés (${propertiesCount})`
        );
      }

      const ownerRisk = await this.assessUserRisk(ownerId);
      riskScore += ownerRisk.riskScore * 0.3;

      if (ownerRisk.riskLevel === 'high' || ownerRisk.riskLevel === 'critical') {
        riskFactors.push('Propriétaire présentant un risque élevé');
        recommendations.push('Vérifier la propriété de manière approfondie');
      }

      const riskLevel = this.calculateRiskLevel(riskScore);
      const shouldAlert = riskLevel === 'high' || riskLevel === 'critical';

      return {
        riskScore,
        riskLevel,
        riskFactors,
        recommendations,
        shouldAlert,
      };
    } catch (error) {
      console.error('Error checking property listing:', error);
      return this.createMediumRiskAssessment([
        'Erreur lors de la vérification',
      ]);
    }
  }

  static async getFraudAlerts(
    status: 'new' | 'investigating' | 'resolved' | 'false_positive' | 'all' = 'all',
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('fraud_detection_alerts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      return [];
    }
  }

  static async updateFraudAlertStatus(
    alertId: string,
    status: 'investigating' | 'resolved' | 'false_positive',
    investigatorId: string,
    notes: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fraud_detection_alerts')
        .update({
          status,
          investigated_by: investigatorId,
          investigated_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', alertId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating fraud alert:', error);
      return false;
    }
  }
}

export const fraudDetectionService = FraudDetectionService;
