import { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, AlertCircle, FileText, Users, TrendingUp } from 'lucide-react';
import { trustValidationService } from '../services/trustValidationService';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  pending: number;
  underReview: number;
  approvedToday: number;
  rejectedToday: number;
  avgTimeHours: number;
  approvalRate: number;
}

export default function TrustAgentDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'under_review' | 'all'>('pending');
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    underReview: 0,
    approvedToday: 0,
    rejectedToday: 0,
    avgTimeHours: 0,
    approvalRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      const filters: any = {};
      if (activeTab !== 'all') {
        filters.status = activeTab;
      }

      const data = await trustValidationService.getValidationRequests(filters);
      setRequests(data);

      calculateStats(data);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allRequests: any[]) => {
    const pending = allRequests.filter(r => r.status === 'pending').length;
    const underReview = allRequests.filter(r => r.status === 'under_review').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedToday = allRequests.filter(r =>
      r.status === 'approved' &&
      new Date(r.validated_at) >= today
    ).length;

    const rejectedToday = allRequests.filter(r =>
      r.status === 'rejected' &&
      new Date(r.validated_at) >= today
    ).length;

    const completedRequests = allRequests.filter(r =>
      r.status === 'approved' || r.status === 'rejected'
    );

    const approved = completedRequests.filter(r => r.status === 'approved').length;
    const approvalRate = completedRequests.length > 0
      ? (approved / completedRequests.length) * 100
      : 0;

    const timeCompleted = completedRequests.filter(r => r.validated_at && r.requested_at);
    const avgTimeHours = timeCompleted.length > 0
      ? timeCompleted.reduce((acc, r) => {
          const start = new Date(r.requested_at).getTime();
          const end = new Date(r.validated_at).getTime();
          return acc + (end - start) / (1000 * 60 * 60);
        }, 0) / timeCompleted.length
      : 0;

    setStats({
      pending,
      underReview,
      approvedToday,
      rejectedToday,
      avgTimeHours,
      approvalRate
    });
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
  };

  if (!profile || (!profile.available_roles?.includes('trust_agent') && profile.active_role !== 'trust_agent')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé</h2>
          <p className="text-gray-600">
            Cette page est réservée aux agents Tiers de Confiance.
          </p>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <ValidationRequestDetail
        request={selectedRequest}
        onBack={() => {
          setSelectedRequest(null);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Tiers de Confiance
              </h1>
              <p className="text-gray-600">
                Validation manuelle des utilisateurs
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Clock}
            label="En attente"
            value={stats.pending}
            color="yellow"
            badge={stats.pending > 5 ? 'Urgent' : undefined}
          />
          <StatCard
            icon={FileText}
            label="En examen"
            value={stats.underReview}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Approuvées aujourd'hui"
            value={stats.approvedToday}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Taux d'approbation"
            value={`${stats.approvalRate.toFixed(0)}%`}
            color="purple"
            subtitle={`Temps moyen: ${stats.avgTimeHours.toFixed(1)}h`}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6 pt-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`
                  px-4 py-2 font-medium rounded-t-lg transition-colors
                  ${activeTab === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                En attente ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('under_review')}
                className={`
                  px-4 py-2 font-medium rounded-t-lg transition-colors
                  ${activeTab === 'under_review'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                En examen ({stats.underReview})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`
                  px-4 py-2 font-medium rounded-t-lg transition-colors
                  ${activeTab === 'all'
                    ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                Toutes
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune demande à traiter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onView={() => handleViewRequest(request)}
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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  badge,
  subtitle
}: {
  icon: any;
  label: string;
  value: number | string;
  color: 'yellow' | 'blue' | 'green' | 'purple';
  badge?: string;
  subtitle?: string;
}) {
  const colors = {
    yellow: 'from-yellow-500 to-orange-500',
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-full`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-8 h-8 bg-gradient-to-r ${colors[color]} text-white p-1.5 rounded-lg`} />
          {badge && (
            <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, onView }: { request: any; onView: () => void }) {
  const profile = request.profiles;

  const timeAgo = () => {
    const now = new Date().getTime();
    const requested = new Date(request.requested_at).getTime();
    const hours = Math.floor((now - requested) / (1000 * 60 * 60));

    if (hours < 1) return 'Il y a moins d\'1h';
    if (hours === 1) return 'Il y a 1h';
    if (hours < 24) return `Il y a ${hours}h`;

    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  const isUrgent = () => {
    const now = new Date().getTime();
    const requested = new Date(request.requested_at).getTime();
    const hours = (now - requested) / (1000 * 60 * 60);
    return hours > 48;
  };

  return (
    <div
      className={`
        border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer
        ${isUrgent() ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
      `}
      onClick={onView}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {timeAgo()}
            </span>
            {profile?.tenant_score && (
              <span className="font-medium">
                Score ANSUT: {profile.tenant_score}/850
              </span>
            )}
            {profile?.ansut_verified && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Vérifié Mon Toit
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          {isUrgent() && (
            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold mb-2">
              🔴 Urgent (&gt; 48h)
            </span>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Examiner
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidationRequestDetail({ request, onBack }: { request: any; onBack: () => void }) {
  const profile = request.profiles;
  const identityVerif = profile?.identity_verifications?.[0];

  const [formData, setFormData] = useState({
    documentsVerified: false,
    identityVerified: false,
    backgroundCheck: false,
    interviewCompleted: false,
    trustScore: 75,
    agentNotes: '',
    rejectionReason: '',
    additionalInfoRequested: ''
  });

  const [decision, setDecision] = useState<'approve' | 'reject' | 'request_info' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;

    try {
      setSubmitting(true);

      const status = decision === 'approve' ? 'approved' :
                    decision === 'reject' ? 'rejected' :
                    'additional_info_required';

      await trustValidationService.updateValidationRequest({
        requestId: request.id,
        status,
        ...formData
      });

      onBack();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la validation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Validation Manuelle - {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-blue-100">
              Demandé le {new Date(request.requested_at).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Section 1: Informations personnelles */}
            <Section title="Informations Personnelles">
              <InfoGrid>
                <InfoItem label="Nom complet" value={`${profile?.first_name} ${profile?.last_name}`} />
                <InfoItem label="Email" value={profile?.email} />
                <InfoItem label="Téléphone" value={profile?.phone} />
                <InfoItem label="Date de naissance" value={profile?.date_of_birth} />
                <InfoItem label="Numéro CNI" value={profile?.id_number} />
                <InfoItem label="Ville" value={profile?.city || 'Non renseigné'} />
              </InfoGrid>
            </Section>

            {/* Section 2: Vérification Mon Toit */}
            <Section title="Vérification Mon Toit">
              <div className="space-y-3">
                <VerificationStatus
                  label="ONECI"
                  verified={identityVerif?.status === 'verified'}
                  date={identityVerif?.created_at}
                />
                <VerificationStatus
                  label="Score ANSUT"
                  verified={profile?.tenant_score && profile.tenant_score >= 600}
                  value={profile?.tenant_score ? `${profile.tenant_score}/850` : undefined}
                />
              </div>
            </Section>

            {/* Section 3: Documents */}
            <Section title="Documents">
              <div className="grid grid-cols-2 gap-4">
                {identityVerif?.document_image_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">CNI</p>
                    <img
                      src={identityVerif.document_image_url}
                      alt="CNI"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {identityVerif?.selfie_image_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Selfie</p>
                    <img
                      src={identityVerif.selfie_image_url}
                      alt="Selfie"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Section 4: Vérifications manuelles */}
            <Section title="Vérifications Manuelles">
              <div className="space-y-3">
                <Checkbox
                  label="Photo CNI claire et lisible"
                  checked={formData.documentsVerified}
                  onChange={(checked) => setFormData({ ...formData, documentsVerified: checked })}
                />
                <Checkbox
                  label="Selfie correspond à la CNI"
                  checked={formData.identityVerified}
                  onChange={(checked) => setFormData({ ...formData, identityVerified: checked })}
                />
                <Checkbox
                  label="Pas d'anomalie détectée"
                  checked={formData.backgroundCheck}
                  onChange={(checked) => setFormData({ ...formData, backgroundCheck: checked })}
                />
                <Checkbox
                  label="Informations cohérentes"
                  checked={formData.interviewCompleted}
                  onChange={(checked) => setFormData({ ...formData, interviewCompleted: checked })}
                />
              </div>
            </Section>

            {/* Section 5: Notes agent */}
            <Section title="Notes Agent">
              <textarea
                value={formData.agentNotes}
                onChange={(e) => setFormData({ ...formData, agentNotes: e.target.value })}
                placeholder="Vos observations..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Section>

            {/* Section 6: Décision */}
            <Section title="Décision">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setDecision('approve')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all
                      ${decision === 'approve'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Approuver
                  </button>
                  <button
                    onClick={() => setDecision('request_info')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all
                      ${decision === 'request_info'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <AlertCircle className="w-5 h-5 inline mr-2" />
                    Demander infos
                  </button>
                  <button
                    onClick={() => setDecision('reject')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all
                      ${decision === 'reject'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <XCircle className="w-5 h-5 inline mr-2" />
                    Rejeter
                  </button>
                </div>

                {decision === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score de confiance (0-100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.trustScore}
                      onChange={(e) => setFormData({ ...formData, trustScore: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>0</span>
                      <span className="font-semibold text-lg text-blue-600">{formData.trustScore}</span>
                      <span>100</span>
                    </div>
                  </div>
                )}

                {decision === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet *
                    </label>
                    <textarea
                      value={formData.rejectionReason}
                      onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                      placeholder="Expliquez la raison du rejet..."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {decision === 'request_info' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Informations requises *
                    </label>
                    <textarea
                      value={formData.additionalInfoRequested}
                      onChange={(e) => setFormData({ ...formData, additionalInfoRequested: e.target.value })}
                      placeholder="Indiquez quelles informations sont nécessaires..."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>
            </Section>

            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!decision || submitting}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${decision && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {submitting ? 'Envoi en cours...' : 'Valider la décision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="font-medium text-gray-900">{value || 'Non renseigné'}</p>
    </div>
  );
}

function VerificationStatus({
  label,
  verified,
  date,
  value
}: {
  label: string;
  verified: boolean;
  date?: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        {verified ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          {date && (
            <p className="text-xs text-gray-500">
              {new Date(date).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>
      {value && (
        <span className="text-sm font-semibold text-gray-700">{value}</span>
      )}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-gray-900">{label}</span>
    </label>
  );
}
