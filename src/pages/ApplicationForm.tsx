import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle, User, Mail, Phone, MapPin, Shield, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ScoringService } from '../services/scoringService';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

export default function ApplicationForm() {
  const { user, profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    const propertyId = window.location.pathname.split('/').pop();
    if (propertyId) {
      loadProperty(propertyId);
    }
  }, [user]);

  const loadProperty = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        window.location.href = '/recherche';
        return;
      }

      setProperty(data);

      const { data: existingApp } = await supabase
        .from('rental_applications')
        .select('id')
        .eq('property_id', id)
        .eq('applicant_id', user!.id)
        .maybeSingle();

      if (existingApp) {
        setError('Vous avez déjà postulé pour cette propriété');
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Erreur lors du chargement de la propriété');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !property) return;

    setSubmitting(true);
    setError('');

    try {
      const scoreBreakdown = await ScoringService.calculateApplicationScore(user.id);

      const { error: insertError } = await supabase
        .from('rental_applications')
        .insert({
          property_id: property.id,
          applicant_id: user.id,
          cover_letter: coverLetter,
          application_score: scoreBreakdown.totalScore,
          status: 'en_attente',
        });

      if (insertError) throw insertError;

      const notificationMessage = `Nouvelle candidature pour ${property.title} (Score: ${scoreBreakdown.totalScore}/100)`;
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: property.owner_id,
          content: notificationMessage,
        });

      await ScoringService.checkAndAwardAchievements(user.id);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de la candidature');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateApplicationScore = () => {
    let score = 50;

    if (profile?.is_verified) score += 20;
    if (profile?.oneci_verified) score += 15;
    if (profile?.cnam_verified) score += 15;

    if (profile?.full_name) score += 2;
    if (profile?.phone) score += 2;
    if (profile?.city) score += 2;
    if (profile?.bio) score += 3;
    if (profile?.avatar_url) score += 3;
    if (profile?.address) score += 3;

    return Math.min(score, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-terracotta-500"></div>
      </div>
    );
  }

  if (!property) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-coral-50 flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center animate-scale-in">
          <div className="w-24 h-24 bg-gradient-to-br from-olive-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-olive-200">
            <CheckCircle className="h-12 w-12 text-olive-600" />
          </div>
          <h2 className="text-3xl font-bold text-gradient mb-3">Candidature envoyée!</h2>
          <p className="text-gray-700 mb-6 text-lg">
            Votre candidature a été envoyée avec succès au propriétaire. Vous serez notifié de sa réponse.
          </p>
          <p className="text-sm text-terracotta-600 font-medium animate-pulse">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  const applicationScore = calculateApplicationScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 custom-cursor">
      <div className="glass-card border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-terracotta-600 hover:text-terracotta-700 transition-all duration-300 transform hover:scale-105 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-scrapbook p-8 animate-slide-down">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-3 flex items-center space-x-3">
              <FileText className="h-10 w-10 text-terracotta-500" />
              <span>Postuler pour cette propriété</span>
            </h1>
            <div className="bg-gradient-to-r from-terracotta-100 to-coral-100 border-2 border-terracotta-200 rounded-2xl p-4 mt-4">
              <p className="text-gray-900 font-bold text-xl">{property.title}</p>
              <p className="text-gray-700 flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4 text-terracotta-500" />
                <span>{property.city}, {property.neighborhood}</span>
              </p>
              <p className="text-terracotta-600 font-bold text-lg mt-2">
                {property.monthly_rent.toLocaleString()} FCFA/mois
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 animate-shake">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {!profile?.is_verified && (
            <div className="mb-6 p-6 glass-card rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-300 animate-slide-up">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-amber-200 to-yellow-200 p-3 rounded-2xl">
                  <Shield className="h-8 w-8 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-lg mb-2">⚠️ Vérification d'identité recommandée</p>
                  <p className="text-amber-800 mb-3">
                    Pour augmenter vos chances d'être accepté, complétez la vérification de votre identité. Les propriétaires privilégient fortement les locataires vérifiés.
                  </p>
                  <p className="text-amber-700 text-sm mb-4">
                    <strong>Votre candidature sera plus crédible avec:</strong>
                  </p>
                  <ul className="text-amber-700 text-sm space-y-1 mb-4 ml-4 list-disc">
                    <li>Vérification CNI via ONECI</li>
                    <li>Reconnaissance faciale biométrique</li>
                    <li>Validation de vos informations</li>
                  </ul>
                  <a
                    href="/profil"
                    className="inline-block px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all font-bold shadow-lg"
                  >
                    Compléter ma vérification
                  </a>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-200">
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
                <User className="h-6 w-6 text-terracotta-500" />
                <span>Informations personnelles</span>
              </h2>
              <div className="bg-white rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">Nom complet</span>
                  </div>
                  <span className="font-bold text-gray-900">{profile?.full_name || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">Email</span>
                  </div>
                  <span className="font-bold text-gray-900">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">Téléphone</span>
                  </div>
                  <span className="font-bold text-gray-900">{profile?.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">Ville</span>
                  </div>
                  <span className="font-bold text-gray-900">{profile?.city || 'Non renseignée'}</span>
                </div>
              </div>
              <a
                href="/profil"
                className="text-terracotta-600 hover:text-terracotta-700 text-sm font-bold mt-3 inline-block transition-all duration-300 transform hover:scale-105"
              >
                Modifier mes informations →
              </a>
            </div>

            <div className="bg-gradient-to-br from-olive-50 to-green-50 p-6 rounded-2xl border border-olive-200">
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
                <Shield className="h-6 w-6 text-terracotta-500" />
                <span>Statut de vérification</span>
              </h2>
              <div className="bg-white rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Compte vérifié ANSUT</span>
                  <span className={`font-bold px-4 py-2 rounded-full ${
                    profile?.is_verified
                      ? 'bg-gradient-to-r from-olive-100 to-green-100 text-olive-800 border border-olive-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}>
                    {profile?.is_verified ? '✓ Vérifié' : '✗ Non vérifié'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Vérification ONECI</span>
                  <span className={`font-bold px-4 py-2 rounded-full ${
                    profile?.oneci_verified
                      ? 'bg-gradient-to-r from-olive-100 to-green-100 text-olive-800 border border-olive-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}>
                    {profile?.oneci_verified ? '✓ Vérifié' : '✗ Non vérifié'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Vérification CNAM</span>
                  <span className={`font-bold px-4 py-2 rounded-full ${
                    profile?.cnam_verified
                      ? 'bg-gradient-to-r from-olive-100 to-green-100 text-olive-800 border border-olive-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}>
                    {profile?.cnam_verified ? '✓ Vérifié' : '✗ Non vérifié'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-terracotta-50 to-coral-50 p-6 rounded-2xl border border-terracotta-200">
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center space-x-2">
                <FileText className="h-6 w-6 text-terracotta-500" />
                <span>Lettre de motivation</span>
              </h2>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={10}
                required
                placeholder="Présentez-vous et expliquez pourquoi vous souhaitez louer cette propriété...

Quelques points à mentionner:
• Votre situation professionnelle
• Pourquoi cette propriété vous intéresse
• Votre sérieux et fiabilité en tant que locataire
• Toute information pertinente pour le propriétaire"
                className="w-full px-4 py-3 border-2 border-terracotta-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-white"
              />
              <p className="text-sm text-gray-700 mt-3 font-medium">
                💡 Une lettre de motivation détaillée et sincère augmente considérablement vos chances d'être retenu.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                  <Award className="h-6 w-6 text-terracotta-500" />
                  <span>Score de candidature</span>
                </h3>
                <span className="text-3xl font-bold text-gradient">{applicationScore}/100</span>
              </div>
              <div className="bg-white rounded-full h-4 overflow-hidden mb-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-terracotta-500 to-coral-500 h-full transition-all duration-500 shadow-glow"
                  style={{ width: `${applicationScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-800">
                Votre score est calculé en fonction de vos vérifications d'identité. Plus votre score est élevé, plus vous avez de chances d'être retenu.
              </p>
            </div>

            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex items-start space-x-3 mb-6 bg-white p-4 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 rounded border-gray-300 text-terracotta-600 focus:ring-terracotta-500 w-5 h-5"
                />
                <label htmlFor="terms" className="text-sm text-gray-800">
                  Je confirme que toutes les informations fournies sont exactes et j'accepte les{' '}
                  <a href="/conditions" className="text-terracotta-600 hover:text-terracotta-700 font-bold">
                    conditions d'utilisation
                  </a>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !!error}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FileText className="h-6 w-6" />
                <span>{submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
