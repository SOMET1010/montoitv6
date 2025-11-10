import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Shield, CheckCircle, XCircle, Award, Clock, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ScoringService, ScoreBreakdown } from '../../services/scoringService';
import type { Database } from '../../lib/database.types';

type Application = Database['public']['Tables']['rental_applications']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ApplicationDetail() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<Profile | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    const applicationId = window.location.pathname.split('/').pop();
    if (applicationId) {
      loadApplicationDetails(applicationId);
    }
  }, [user]);

  const loadApplicationDetails = async (id: string) => {
    try {
      const { data: appData, error: appError } = await supabase
        .from('rental_applications')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (appError) throw appError;
      if (!appData) {
        window.location.href = '/dashboard/proprietaire';
        return;
      }

      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', appData.property_id)
        .maybeSingle();

      if (propError) throw propError;

      if (propData && propData.owner_id !== user!.id) {
        window.location.href = '/dashboard/proprietaire';
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', appData.applicant_id)
        .maybeSingle();

      if (profileError) throw profileError;

      setApplication(appData);
      setProperty(propData);
      setApplicantProfile(profileData);

      const breakdown = await ScoringService.calculateApplicationScore(appData.applicant_id);
      setScoreBreakdown(breakdown);
    } catch (error: any) {
      console.error('Error loading application:', error);
      setError('Erreur lors du chargement de la candidature');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'acceptee' | 'refusee') => {
    if (!application) return;

    setUpdating(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('rental_applications')
        .update({ status: newStatus })
        .eq('id', application.id);

      if (updateError) throw updateError;

      const message = newStatus === 'acceptee'
        ? `Votre candidature pour ${property?.title} a été acceptée!`
        : `Votre candidature pour ${property?.title} a été refusée.`;

      await supabase.from('messages').insert({
        sender_id: user!.id,
        receiver_id: application.applicant_id,
        content: message,
      });

      setApplication({ ...application, status: newStatus });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  if (!application || !property || !applicantProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">Candidature introuvable</p>
        </div>
      </div>
    );
  }

  const scoreBadge = ScoringService.getScoreBadge(application.application_score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 custom-cursor">
      <div className="glass-card border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-terracotta-600 hover:text-terracotta-700 transition-all duration-300 transform hover:scale-105 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour aux candidatures</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 animate-shake">
            {error}
          </div>
        )}

        <div className="mb-6 card-scrapbook p-6 animate-slide-down">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gradient mb-2">{property.title}</h1>
              <p className="text-gray-700 flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-terracotta-500" />
                <span>{property.city}, {property.neighborhood}</span>
              </p>
              <p className="text-terracotta-600 font-bold text-xl mt-2">
                {property.monthly_rent.toLocaleString()} FCFA/mois
              </p>
            </div>
            <div className="ml-4">
              <span className={`px-4 py-2 rounded-full font-bold text-sm border-2 ${
                application.status === 'en_attente'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : application.status === 'acceptee'
                  ? 'bg-olive-100 text-olive-800 border-olive-300'
                  : application.status === 'refusee'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              }`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-scrapbook p-8 animate-slide-up">
              <div className="flex items-center space-x-4 mb-6">
                {applicantProfile.avatar_url ? (
                  <img
                    src={applicantProfile.avatar_url}
                    alt={applicantProfile.full_name || 'Candidat'}
                    className="w-20 h-20 rounded-full border-4 border-terracotta-200 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta-500 to-coral-500 flex items-center justify-center border-4 border-white">
                    <span className="text-white font-bold text-3xl">
                      {applicantProfile.full_name?.[0]?.toUpperCase() || 'C'}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gradient">{applicantProfile.full_name || 'Nom non renseigné'}</h2>
                  <p className="text-gray-600 text-sm capitalize">{applicantProfile.user_type}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-200 mb-6">
                <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                  <User className="h-6 w-6 text-terracotta-500" />
                  <span>Informations de contact</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-800">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{application.applicant_id}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-800">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{applicantProfile.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-800">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>{applicantProfile.city || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-olive-50 to-green-50 p-6 rounded-2xl border border-olive-200 mb-6">
                <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-terracotta-500" />
                  <span>Vérifications</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Vérification ANSUT</span>
                    {applicantProfile.is_verified ? (
                      <CheckCircle className="h-6 w-6 text-olive-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Vérification ONECI</span>
                    {applicantProfile.oneci_verified ? (
                      <CheckCircle className="h-6 w-6 text-olive-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Vérification CNAM</span>
                    {applicantProfile.cnam_verified ? (
                      <CheckCircle className="h-6 w-6 text-olive-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {application.cover_letter && (
                <div className="bg-gradient-to-br from-terracotta-50 to-coral-50 p-6 rounded-2xl border border-terracotta-200">
                  <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                    <FileText className="h-6 w-6 text-terracotta-500" />
                    <span>Lettre de motivation</span>
                  </h3>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{application.cover_letter}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="card-scrapbook p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                <Award className="h-6 w-6 text-terracotta-500" />
                <span>Score de candidature</span>
              </h3>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gradient mb-2">
                  {application.application_score}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm border-2 ${scoreBadge.color}`}>
                  {scoreBadge.text}
                </div>
              </div>

              <div className="bg-white rounded-full h-4 overflow-hidden mb-6 shadow-inner">
                <div
                  className={`bg-gradient-to-r ${ScoringService.getScoreColor(application.application_score)} h-full transition-all duration-500`}
                  style={{ width: `${application.application_score}%` }}
                />
              </div>

              {scoreBreakdown && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Score de base</span>
                    <span className="font-bold text-gray-900">{scoreBreakdown.baseScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Vérifications</span>
                    <span className="font-bold text-olive-600">+{scoreBreakdown.verificationBonus}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Profil complet</span>
                    <span className="font-bold text-cyan-600">+{scoreBreakdown.profileCompletenessBonus}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gradient text-lg">{scoreBreakdown.totalScore}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-scrapbook p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-bold text-gradient mb-4 flex items-center space-x-2">
                <Clock className="h-6 w-6 text-terracotta-500" />
                <span>Détails</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Date de candidature</p>
                  <p className="font-bold text-gray-900">
                    {new Date(application.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Dernière mise à jour</p>
                  <p className="font-bold text-gray-900">
                    {new Date(application.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {application.status === 'en_attente' && (
              <div className="card-scrapbook p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-bold text-gradient mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleUpdateStatus('acceptee')}
                    disabled={updating}
                    className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{updating ? 'En cours...' : 'Accepter'}</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('refusee')}
                    disabled={updating}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>{updating ? 'En cours...' : 'Refuser'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
