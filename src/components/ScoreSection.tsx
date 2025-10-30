import { useState, useEffect } from 'react';
import { Award, TrendingUp, Target, Clock, Star } from 'lucide-react';
import { ScoringService, ScoreBreakdown, ScoreHistory, Achievement } from '../services/scoringService';

interface ScoreSectionProps {
  userId: string;
}

export default function ScoreSection({ userId }: ScoreSectionProps) {
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements'>('overview');

  useEffect(() => {
    loadScoreData();
  }, [userId]);

  const loadScoreData = async () => {
    try {
      const [breakdown, history, achievementsList] = await Promise.all([
        ScoringService.calculateApplicationScore(userId),
        ScoringService.getScoreHistory(userId, 10),
        ScoringService.getAchievements(userId),
      ]);

      setScoreBreakdown(breakdown);
      setScoreHistory(history);
      setAchievements(achievementsList);
    } catch (error) {
      console.error('Error loading score data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-scrapbook p-8 animate-scale-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-terracotta-500"></div>
        </div>
      </div>
    );
  }

  if (!scoreBreakdown) {
    return null;
  }

  const scoreBadge = ScoringService.getScoreBadge(scoreBreakdown.totalScore);

  return (
    <div className="card-scrapbook p-8 animate-scale-in">
      <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
        <Award className="h-7 w-7 text-terracotta-500" />
        <span>Mon Score Locataire</span>
      </h2>

      <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 rounded-2xl border-2 border-amber-300 mb-6">
        <div className="text-center mb-4">
          <div className="text-6xl font-bold text-gradient mb-3">{scoreBreakdown.totalScore}</div>
          <div className={`inline-block px-6 py-2 rounded-full font-bold text-lg border-2 ${scoreBadge.color}`}>
            {scoreBadge.text}
          </div>
        </div>

        <div className="bg-white rounded-full h-6 overflow-hidden shadow-inner">
          <div
            className={`bg-gradient-to-r ${ScoringService.getScoreColor(scoreBreakdown.totalScore)} h-full transition-all duration-500 shadow-glow`}
            style={{ width: `${scoreBreakdown.totalScore}%` }}
          />
        </div>

        <p className="text-center text-gray-700 mt-4 text-sm">
          Votre score vous aide à vous démarquer auprès des propriétaires
        </p>
      </div>

      <div className="flex space-x-2 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-bold transition-all duration-300 ${
            activeTab === 'overview'
              ? 'text-terracotta-600 border-b-4 border-terracotta-500'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-bold transition-all duration-300 ${
            activeTab === 'history'
              ? 'text-terracotta-600 border-b-4 border-terracotta-500'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Historique
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 font-bold transition-all duration-300 ${
            activeTab === 'achievements'
              ? 'text-terracotta-600 border-b-4 border-terracotta-500'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Réussites
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Target className="h-5 w-5 text-terracotta-500" />
              <span>Détail du score</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Score de base</span>
                <span className="font-bold text-gray-900">{scoreBreakdown.baseScore} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Bonus vérifications</span>
                <span className="font-bold text-olive-600">+{scoreBreakdown.verificationBonus} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Profil complet</span>
                <span className="font-bold text-cyan-600">+{scoreBreakdown.profileCompletenessBonus} pts</span>
              </div>
              <div className="border-t-2 border-cyan-300 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-bold text-gradient text-2xl">{scoreBreakdown.totalScore} pts</span>
                </div>
              </div>
            </div>
          </div>

          {scoreBreakdown.improvements.length > 0 && (
            <div className="bg-gradient-to-br from-olive-50 to-green-50 p-6 rounded-2xl border border-olive-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-terracotta-500" />
                <span>Comment améliorer votre score</span>
              </h3>
              <ul className="space-y-2">
                {scoreBreakdown.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-800">
                    <Star className="h-5 w-5 text-olive-600 flex-shrink-0 mt-0.5" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-terracotta-100 to-coral-100 border-2 border-terracotta-200">
            <h4 className="font-bold text-terracotta-900 mb-2 flex items-center space-x-2">
              <span>💡</span>
              <span>Le saviez-vous?</span>
            </h4>
            <p className="text-sm text-terracotta-800 leading-relaxed">
              Les candidats avec un score supérieur à 80 ont 3 fois plus de chances d'être acceptés par les propriétaires.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {scoreHistory.length > 0 ? (
            scoreHistory.map((entry) => (
              <div
                key={entry.id}
                className="bg-gradient-to-br from-white to-amber-50 border-2 border-gray-200 rounded-xl p-4 hover:border-terracotta-300 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-gray-900">
                        {entry.old_score} → {entry.new_score}
                      </span>
                      {entry.new_score > entry.old_score ? (
                        <TrendingUp className="h-5 w-5 text-olive-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-600 transform rotate-180" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{entry.change_reason}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs text-gray-600">
                      {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun historique de score pour le moment</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-5 animate-scale-in"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{achievement.achievement_name}</h4>
                    <p className="text-gray-700 text-sm mb-2">{achievement.achievement_description}</p>
                    <span className="text-xs text-gray-600">
                      Obtenu le {new Date(achievement.achieved_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucune réussite débloquée</p>
              <p className="text-sm text-gray-500">Améliorez votre score pour débloquer des récompenses!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
