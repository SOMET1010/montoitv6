import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Award, TrendingUp, Shield, CreditCard, User, MessageSquare,
  Star, Clock, ArrowRight, CheckCircle, Lock, Trophy
} from 'lucide-react';

interface TenantScore {
  total_score: number;
  identity_score: number;
  payment_score: number;
  profile_score: number;
  engagement_score: number;
  reputation_score: number;
  tenure_score: number;
  score_tier: string;
  last_calculated_at: string;
}

interface Achievement {
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  achievement_color: string;
  earned: boolean;
  earned_at: string | null;
  progress: number;
}

const TIER_CONFIG = {
  bronze: { name: 'Bronze', color: '#CD7F32', gradient: 'from-amber-600 to-amber-800' },
  silver: { name: 'Argent', color: '#C0C0C0', gradient: 'from-gray-300 to-gray-500' },
  gold: { name: 'Or', color: '#FFD700', gradient: 'from-yellow-400 to-yellow-600' },
  platinum: { name: 'Platine', color: '#E5E4E2', gradient: 'from-cyan-300 to-cyan-500' },
  diamond: { name: 'Diamant', color: '#B9F2FF', gradient: 'from-blue-300 to-blue-500' },
};

export default function TenantScore() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<TenantScore | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (user) {
      loadScoreData();
    }
  }, [user]);

  const loadScoreData = async () => {
    if (!user) return;

    try {
      const { data: scoreData } = await supabase
        .from('tenant_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scoreData) {
        setScore(scoreData);
      }

      const { data: achievementsData } = await supabase
        .from('score_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (achievementsData) {
        setAchievements(achievementsData);
      }
    } catch (err) {
      console.error('Error loading score:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = async () => {
    if (!user) return;

    setCalculating(true);
    try {
      const { data, error } = await supabase.rpc('calculate_tenant_score', {
        p_user_id: user.id
      });

      if (error) throw error;

      await loadScoreData();
    } catch (err) {
      console.error('Error calculating score:', err);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  const tierInfo = score ? TIER_CONFIG[score.score_tier as keyof typeof TIER_CONFIG] : TIER_CONFIG.bronze;
  const scorePercent = score ? score.total_score : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mon Score Locataire
          </h1>
          <p className="text-xl text-gray-600">
            Suivez votre réputation et débloquez des avantages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 card-scrapbook p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Score Global</h2>
              <button
                onClick={calculateScore}
                disabled={calculating}
                className="btn-secondary flex items-center space-x-2"
              >
                {calculating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-olive-600"></div>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    <span>Recalculer</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center mb-12">
              <div className="relative">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${(scorePercent / 100) * 553} 553`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={tierInfo.color} stopOpacity="0.8" />
                      <stop offset="100%" stopColor={tierInfo.color} stopOpacity="1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-bold" style={{ color: tierInfo.color }}>
                    {Math.round(scorePercent)}
                  </div>
                  <div className="text-gray-500 text-lg">/ 100</div>
                </div>
              </div>
            </div>

            <div className={`text-center p-6 rounded-2xl bg-gradient-to-r ${tierInfo.gradient} shadow-lg`}>
              <div className="flex items-center justify-center space-x-3 mb-2">
                <Trophy className="h-8 w-8 text-white" />
                <h3 className="text-3xl font-bold text-white">
                  Niveau {tierInfo.name}
                </h3>
              </div>
              <p className="text-white text-opacity-90">
                {score && score.score_tier === 'diamond' && 'Statut VIP - Le meilleur des meilleurs !'}
                {score && score.score_tier === 'platinum' && 'Excellence - Locataire premium'}
                {score && score.score_tier === 'gold' && 'Excellent profil - Très recherché'}
                {score && score.score_tier === 'silver' && 'Bon profil - En progression'}
                {score && score.score_tier === 'bronze' && 'Débutant - Continuez vos efforts'}
              </p>
            </div>
          </div>

          <div className="card-scrapbook p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Award className="h-6 w-6 text-terracotta-600" />
              <span>Avantages Niveau</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-olive-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-gray-900">Badge certifié</p>
                  <p className="text-sm text-gray-600">Visible sur votre profil</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-olive-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-gray-900">Priorité candidatures</p>
                  <p className="text-sm text-gray-600">Vos dossiers en premier</p>
                </div>
              </div>
              {scorePercent >= 60 && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-olive-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-gray-900">Profil mis en avant</p>
                    <p className="text-sm text-gray-600">Plus de visibilité</p>
                  </div>
                </div>
              )}
              {scorePercent >= 75 && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-olive-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-gray-900">Support premium</p>
                    <p className="text-sm text-gray-600">Assistance prioritaire</p>
                  </div>
                </div>
              )}
              {scorePercent >= 90 && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-olive-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-gray-900">Accès VIP</p>
                    <p className="text-sm text-gray-600">Propriétés exclusives</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {score && (
          <div className="card-scrapbook p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Détail du Score</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ScoreCriterion
                icon={Shield}
                title="Identité"
                score={score.identity_score}
                maxScore={20}
                color="text-terracotta-600"
                bgColor="bg-terracotta-100"
              />
              <ScoreCriterion
                icon={CreditCard}
                title="Paiements"
                score={score.payment_score}
                maxScore={25}
                color="text-olive-600"
                bgColor="bg-olive-100"
              />
              <ScoreCriterion
                icon={User}
                title="Profil"
                score={score.profile_score}
                maxScore={15}
                color="text-cyan-600"
                bgColor="bg-cyan-100"
              />
              <ScoreCriterion
                icon={MessageSquare}
                title="Engagement"
                score={score.engagement_score}
                maxScore={15}
                color="text-coral-600"
                bgColor="bg-coral-100"
              />
              <ScoreCriterion
                icon={Star}
                title="Réputation"
                score={score.reputation_score}
                maxScore={15}
                color="text-amber-600"
                bgColor="bg-amber-100"
              />
              <ScoreCriterion
                icon={Clock}
                title="Ancienneté"
                score={score.tenure_score}
                maxScore={10}
                color="text-gray-600"
                bgColor="bg-gray-100"
              />
            </div>
          </div>
        )}

        <div className="card-scrapbook p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <Trophy className="h-7 w-7 text-amber-600" />
            <span>Achievements & Badges</span>
          </h2>

          {achievements.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-6">
                Complétez votre profil et effectuez des actions pour débloquer des badges !
              </p>
              <a href="/profile/verification" className="btn-primary inline-flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Commencer la certification</span>
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.achievement_type}
                  className={`p-4 rounded-xl text-center transition-all ${
                    achievement.earned
                      ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-md'
                      : 'bg-gray-100 border-2 border-gray-200 opacity-60'
                  }`}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{
                      backgroundColor: achievement.earned ? achievement.achievement_color + '20' : '#E5E7EB',
                    }}
                  >
                    <Award
                      className="h-8 w-8"
                      style={{ color: achievement.earned ? achievement.achievement_color : '#9CA3AF' }}
                    />
                  </div>
                  <p className="font-bold text-sm text-gray-900 mb-1">{achievement.achievement_name}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{achievement.achievement_description}</p>
                  {!achievement.earned && achievement.progress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-olive-500 h-2 rounded-full transition-all"
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{Math.round(achievement.progress)}%</p>
                    </div>
                  )}
                  {achievement.earned && achievement.earned_at && (
                    <p className="text-xs text-olive-600 mt-2">
                      {new Date(achievement.earned_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCriterion({
  icon: Icon,
  title,
  score,
  maxScore,
  color,
  bgColor,
}: {
  icon: any;
  title: string;
  score: number;
  maxScore: number;
  color: string;
  bgColor: string;
}) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-olive-200 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{Math.round(score)}</div>
          <div className="text-sm text-gray-500">/ {maxScore}</div>
        </div>
      </div>
      <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${bgColor.replace('100', '500')}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
