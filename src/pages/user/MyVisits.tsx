import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, MapPin, Video, X, Check, MessageCircle, Star } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface Visit {
  id: string;
  property_id: string;
  visit_type: 'physique' | 'virtuelle';
  visit_date: string;
  visit_time: string;
  status: 'en_attente' | 'confirmee' | 'annulee' | 'terminee';
  visitor_notes: string | null;
  owner_notes: string | null;
  feedback: string | null;
  rating: number | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    main_image: string;
  };
  owner: {
    id: string;
    full_name: string;
    phone: string;
  };
}

export default function MyVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      loadVisits();
    }
  }, [user, filter]);

  const loadVisits = async () => {
    try {
      let query = supabase
        .from('property_visits')
        .select(`
          id,
          property_id,
          visit_type,
          visit_date,
          visit_time,
          status,
          visitor_notes,
          owner_notes,
          feedback,
          rating,
          properties!inner(id, title, address, city, main_image, owner_id),
          profiles!property_visits_owner_id_fkey(id, full_name, phone)
        `)
        .eq('visitor_id', user?.id)
        .order('visit_date', { ascending: false })
        .order('visit_time', { ascending: false });

      if (filter === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('visit_date', today).in('status', ['en_attente', 'confirmee']);
      } else if (filter === 'past') {
        const today = new Date().toISOString().split('T')[0];
        query = query.or(`visit_date.lt.${today},status.eq.terminee,status.eq.annulee`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedVisits = (data || []).map((visit: any) => ({
        id: visit.id,
        property_id: visit.property_id,
        visit_type: visit.visit_type,
        visit_date: visit.visit_date,
        visit_time: visit.visit_time,
        status: visit.status,
        visitor_notes: visit.visitor_notes,
        owner_notes: visit.owner_notes,
        feedback: visit.feedback,
        rating: visit.rating,
        property: visit.properties,
        owner: visit.profiles
      }));

      setVisits(formattedVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelVisit = async (visitId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) return;

    try {
      const { error } = await supabase
        .from('property_visits')
        .update({
          status: 'annulee',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancellation_reason: 'Annulée par le visiteur'
        })
        .eq('id', visitId);

      if (error) throw error;
      loadVisits();
    } catch (error) {
      console.error('Error cancelling visit:', error);
      alert('Erreur lors de l\'annulation de la visite');
    }
  };

  const openFeedbackModal = (visit: Visit) => {
    setSelectedVisit(visit);
    setFeedback(visit.feedback || '');
    setRating(visit.rating || 0);
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!selectedVisit || rating === 0) return;

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('property_visits')
        .update({
          feedback,
          rating,
          status: 'terminee'
        })
        .eq('id', selectedVisit.id);

      if (error) throw error;

      setShowFeedbackModal(false);
      loadVisits();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Erreur lors de l\'envoi du feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      confirmee: 'bg-green-100 text-green-800',
      annulee: 'bg-red-100 text-red-800',
      terminee: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      annulee: 'Annulée',
      terminee: 'Terminée'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour voir vos visites
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Mes visites</h1>

            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'upcoming'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                À venir
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'past'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Passées
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Toutes
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : visits.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune visite
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore planifié de visite
              </p>
              <a href="/recherche" className="btn-primary inline-block">
                Rechercher des biens
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {visits.map((visit) => (
                <div key={visit.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img
                        src={visit.property.main_image || 'https://via.placeholder.com/400x300'}
                        alt={visit.property.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {visit.property.title}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {visit.property.address}, {visit.property.city}
                          </p>
                        </div>
                        {getStatusBadge(visit.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          <span>{formatDate(visit.visit_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="w-5 h-5 text-orange-500" />
                          <span>{formatTime(visit.visit_time)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          {visit.visit_type === 'physique' ? (
                            <>
                              <MapPin className="w-5 h-5 text-orange-500" />
                              <span>Visite physique</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-5 h-5 text-orange-500" />
                              <span>Visite virtuelle</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <MessageCircle className="w-5 h-5 text-orange-500" />
                          <span>{visit.owner.full_name}</span>
                        </div>
                      </div>

                      {visit.visitor_notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Mes notes :</p>
                          <p className="text-sm text-gray-600">{visit.visitor_notes}</p>
                        </div>
                      )}

                      {visit.owner_notes && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-700 mb-1">Note du propriétaire :</p>
                          <p className="text-sm text-blue-600">{visit.owner_notes}</p>
                        </div>
                      )}

                      {visit.feedback && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-green-700">Mon avis :</p>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= (visit.rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-green-600">{visit.feedback}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`/propriete/${visit.property_id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          Voir le bien
                        </a>

                        {visit.status === 'en_attente' || visit.status === 'confirmee' ? (
                          <button
                            onClick={() => cancelVisit(visit.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            Annuler
                          </button>
                        ) : null}

                        {visit.status === 'confirmee' && !visit.feedback && (
                          <button
                            onClick={() => openFeedbackModal(visit)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            Laisser un avis
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showFeedbackModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Laisser un avis</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Note
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Commentaire
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Partagez votre expérience..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={submitFeedback}
                disabled={rating === 0 || submittingFeedback}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
