import { useState, useEffect } from 'react';
import { Shield, MessageSquare, Clock, CheckCircle, AlertTriangle, Send, ArrowUpCircle } from 'lucide-react';
import { disputeService } from '../../services/trustValidationService';
import { useAuth } from '../../contexts/AuthContext';

export default function TrustAgentMediation() {
  const { profile } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'assigned' | 'under_mediation' | 'all'>('assigned');

  useEffect(() => {
    loadDisputes();
  }, [filter]);

  useEffect(() => {
    if (selectedDispute) {
      loadMessages();
    }
  }, [selectedDispute]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const data = await disputeService.getDisputes(filters);
      setDisputes(data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedDispute) return;
    try {
      const data = await disputeService.getDisputeMessages(selectedDispute.id);
      setMessages(data);
    } catch (err) {
      console.error('Erreur messages:', err);
    }
  };

  const stats = {
    assigned: disputes.filter(d => d.status === 'assigned').length,
    underMediation: disputes.filter(d => d.status === 'under_mediation').length,
    awaiting: disputes.filter(d => d.status === 'awaiting_response').length,
    resolved: disputes.filter(d => d.status === 'resolved').length
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé</h2>
          <p className="text-gray-600">Cette page est réservée aux médiateurs.</p>
        </div>
      </div>
    );
  }

  if (selectedDispute) {
    return (
      <MediationDetail
        dispute={selectedDispute}
        messages={messages}
        onBack={() => {
          setSelectedDispute(null);
          loadDisputes();
        }}
        onUpdate={loadDisputes}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Médiation de Litiges</h1>
              <p className="text-gray-600">Résolvez les conflits entre locataires et propriétaires</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Clock} label="Nouveaux" value={stats.assigned} color="blue" />
          <StatCard icon={MessageSquare} label="En médiation" value={stats.underMediation} color="indigo" />
          <StatCard icon={AlertTriangle} label="En attente" value={stats.awaiting} color="orange" />
          <StatCard icon={CheckCircle} label="Résolus" value={stats.resolved} color="green" />
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6 pt-6">
              <FilterButton
                label="Nouveaux"
                active={filter === 'assigned'}
                count={stats.assigned}
                onClick={() => setFilter('assigned')}
              />
              <FilterButton
                label="En médiation"
                active={filter === 'under_mediation'}
                count={stats.underMediation}
                onClick={() => setFilter('under_mediation')}
              />
              <FilterButton
                label="Tous"
                active={filter === 'all'}
                count={disputes.length}
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
            ) : disputes.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun litige à traiter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map(dispute => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    onClick={() => setSelectedDispute(dispute)}
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
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-orange-600',
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
          ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function DisputeCard({ dispute, onClick }: any) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getUrgencyBadge = () => {
    if (dispute.urgency === 'urgent') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 URGENT</span>;
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{dispute.dispute_number}</h3>
            {getUrgencyBadge()}
          </div>
          <p className="text-sm text-gray-600 mb-2">{dispute.description.substring(0, 100)}...</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span>📅 {formatDate(dispute.opened_at)}</span>
            <span>🏠 {dispute.leases?.properties?.title}</span>
            {dispute.amount_disputed && (
              <span className="font-semibold text-orange-600">
                💰 {new Intl.NumberFormat('fr-FR').format(dispute.amount_disputed)} FCFA
              </span>
            )}
          </div>
        </div>
        <button className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          Médier
        </button>
      </div>
    </div>
  );
}

function MediationDetail({ dispute, messages, onBack, onUpdate }: any) {
  const [resolution, setResolution] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [showEscalate, setShowEscalate] = useState(false);

  const handleProposeResolution = async () => {
    if (!resolution.trim()) {
      alert('Veuillez rédiger une proposition');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir envoyer cette proposition ?')) return;

    try {
      setSending(true);
      await disputeService.proposeResolution({
        disputeId: dispute.id,
        resolutionProposed: resolution
      });
      alert('Proposition envoyée avec succès !');
      onUpdate();
      onBack();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim()) {
      alert('Veuillez indiquer la raison de l\'escalade');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir escalader ce litige ?')) return;

    try {
      setSending(true);
      await disputeService.escalateDispute(dispute.id, 'external_arbitration', escalateReason);
      alert('Litige escaladé vers arbitrage externe');
      onUpdate();
      onBack();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'escalade');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium">
          ← Retour à la liste
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analyse du Litige</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{dispute.dispute_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-orange-600">
                    {dispute.amount_disputed ? `${new Intl.NumberFormat('fr-FR').format(dispute.amount_disputed)} FCFA` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Ouvert par</h4>
                  <p className="text-blue-800">
                    {dispute.opener?.first_name} {dispute.opener?.last_name}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Contre</h4>
                  <p className="text-purple-800">
                    {dispute.opponent?.first_name} {dispute.opponent?.last_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Proposer une Résolution</h2>

              {dispute.resolution_proposed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">Proposition envoyée</p>
                  <p className="text-green-800 whitespace-pre-wrap">{dispute.resolution_proposed}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {dispute.resolution_accepted_by_opener ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="text-sm">
                        Ouvreur: {dispute.resolution_accepted_by_opener ? 'Accepté' : 'En attente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dispute.resolution_accepted_by_opponent ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="text-sm">
                        Opposant: {dispute.resolution_accepted_by_opponent ? 'Accepté' : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Décrivez votre proposition de résolution équitable..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
                  />
                  <button
                    onClick={handleProposeResolution}
                    disabled={sending}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {sending ? 'Envoi...' : '📤 Envoyer la Proposition'}
                  </button>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={() => setShowEscalate(!showEscalate)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ArrowUpCircle className="w-6 h-6 text-red-600" />
                  Escalader vers Arbitrage
                </h2>
                <span className="text-gray-400">{showEscalate ? '▼' : '▶'}</span>
              </button>

              {showEscalate && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Si les parties ne peuvent pas s'entendre, escaladez vers un arbitrage externe.
                  </p>
                  <textarea
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    placeholder="Raison de l'escalade..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
                  />
                  <button
                    onClick={handleEscalate}
                    disabled={sending}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                  >
                    {sending ? 'Escalade...' : '⚠️ Escalader le Litige'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">💬 Messages</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun message</p>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">
                        {msg.profiles?.first_name} - {new Date(msg.sent_at).toLocaleTimeString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-900">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
