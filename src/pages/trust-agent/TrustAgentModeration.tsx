import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';
import { moderationService } from '../../services/trustValidationService';
import { useAuth } from '../../contexts/AuthContext';

export default function TrustAgentModeration() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high_risk'>('pending');

  useEffect(() => {
    loadQueue();
  }, [filter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (filter === 'pending') {
        filters.status = 'pending';
      } else if (filter === 'high_risk') {
        filters.status = 'pending';
        filters.minSuspicionScore = 70;
      }

      const data = await moderationService.getModerationQueue(filters);
      setQueue(data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    highRisk: queue.filter(q => q.suspicion_score >= 70).length,
    approved: queue.filter(q => q.status === 'approved').length
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé</h2>
          <p className="text-gray-600">Cette page est réservée aux modérateurs.</p>
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <ModerationDetail
        item={selectedItem}
        onBack={() => {
          setSelectedItem(null);
          loadQueue();
        }}
        onUpdate={loadQueue}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modération des Annonces</h1>
              <p className="text-gray-600">Détection automatique de fraudes par IA</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Eye} label="Total" value={stats.total} color="gray" />
          <StatCard icon={AlertTriangle} label="En attente" value={stats.pending} color="orange" />
          <StatCard icon={XCircle} label="Haut risque" value={stats.highRisk} color="red" />
          <StatCard icon={CheckCircle} label="Approuvées" value={stats.approved} color="green" />
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6 pt-6">
              <FilterButton
                label="En attente"
                active={filter === 'pending'}
                count={stats.pending}
                onClick={() => setFilter('pending')}
              />
              <FilterButton
                label="Haut risque"
                active={filter === 'high_risk'}
                count={stats.highRisk}
                onClick={() => setFilter('high_risk')}
              />
              <FilterButton
                label="Toutes"
                active={filter === 'all'}
                count={stats.total}
                onClick={() => setFilter('all')}
              />
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune annonce à modérer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map(item => (
                  <PropertyCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors = {
    gray: 'from-gray-500 to-gray-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Icon className={`w-8 h-8 bg-gradient-to-r ${colors[color]} text-white p-1.5 rounded-lg mb-2`} />
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function FilterButton({ label, active, count, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
        active
          ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function PropertyCard({ item, onClick }: any) {
  const property = item.properties;
  const owner = property?.profiles;

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div
      onClick={onClick}
      className={`
        border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer
        ${item.suspicion_score >= 80 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
      `}
    >
      <div className="flex gap-4">
        {property?.images?.[0] && (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-32 h-32 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{property?.title}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {property?.address}
              </p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(item.suspicion_score)}`}>
                {item.suspicion_score}/100
              </div>
              <p className="text-xs text-gray-500 mt-1">Score suspicion</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Propriétaire:</span> {owner?.first_name} {owner?.last_name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Prix:</span> {new Intl.NumberFormat('fr-FR').format(property?.price)} FCFA/mois
            </p>
          </div>

          {item.suspicion_reasons?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.suspicion_reasons.map((reason: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  ⚠️ {reason}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Examiner
          </button>
        </div>
      </div>
    </div>
  );
}

function ModerationDetail({ item, onBack, onUpdate }: any) {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const property = item.properties;
  const owner = property?.profiles;

  const handleModerate = async () => {
    if (!decision) {
      alert('Veuillez prendre une décision');
      return;
    }

    try {
      setSubmitting(true);
      await moderationService.moderateProperty(item.id, decision, notes);
      alert('Modération effectuée avec succès');
      onUpdate();
      onBack();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la modération');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium">
          ← Retour à la file
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Modération: {property?.title}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Score: {item.suspicion_score}/100
              </span>
              <span>Ajouté le {new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Photos de l'annonce</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property?.images?.slice(0, 4).map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Informations</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Propriétaire</p>
                    <p className="font-medium">{owner?.first_name} {owner?.last_name}</p>
                    <p className="text-sm text-gray-500">{owner?.email}</p>
                    <p className="text-sm text-gray-500">{owner?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-medium">{property?.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prix</p>
                    <p className="font-semibold text-lg text-blue-600">
                      {new Intl.NumberFormat('fr-FR').format(property?.price)} FCFA/mois
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Caractéristiques</p>
                    <p className="font-medium">
                      {property?.bedrooms} ch · {property?.bathrooms} sdb · {property?.surface} m²
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3">⚠️ Alertes de Suspicion</h3>
              <div className="space-y-2">
                {item.suspicion_reasons?.map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">📝 Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{property?.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">💬 Notes de Modération</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Vos observations sur cette annonce..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">✅ Décision</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => setDecision('approved')}
                  className={`py-4 rounded-lg font-semibold transition-all ${
                    decision === 'approved'
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-6 h-6 inline mr-2" />
                  Approuver l'annonce
                </button>
                <button
                  onClick={() => setDecision('rejected')}
                  className={`py-4 rounded-lg font-semibold transition-all ${
                    decision === 'rejected'
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <XCircle className="w-6 h-6 inline mr-2" />
                  Rejeter l'annonce
                </button>
              </div>

              {decision && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    {decision === 'approved'
                      ? '✅ L\'annonce sera visible publiquement et le propriétaire sera notifié.'
                      : '❌ L\'annonce sera supprimée et le propriétaire sera notifié avec vos notes.'}
                  </p>
                </div>
              )}

              <button
                onClick={handleModerate}
                disabled={!decision || submitting}
                className="w-full py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Envoi en cours...' : '🔒 Valider la Décision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
