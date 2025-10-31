import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, MessageSquare, ArrowUpCircle, FileText } from 'lucide-react';
import { disputeService } from '../services/trustValidationService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function MyDisputes() {
  const { profile } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    if (profile?.id) {
      loadDisputes();
    }
  }, [profile?.id, filter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const filters: any = { userId: profile!.id };

      if (filter === 'open') {
        filters.status = 'open,assigned,under_mediation,awaiting_response';
      } else if (filter === 'resolved') {
        filters.status = 'resolved,closed';
      }

      const data = await disputeService.getDisputes(filters);
      setDisputes(data);
    } catch (err) {
      console.error('Erreur chargement litiges:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return {
          icon: AlertTriangle,
          label: 'Ouvert',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200'
        };
      case 'assigned':
        return {
          icon: Clock,
          label: 'Assigné à un médiateur',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
      case 'under_mediation':
        return {
          icon: MessageSquare,
          label: 'En médiation',
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          border: 'border-indigo-200'
        };
      case 'awaiting_response':
        return {
          icon: Clock,
          label: 'En attente de réponse',
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200'
        };
      case 'resolved':
        return {
          icon: CheckCircle,
          label: 'Résolu',
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        };
      case 'escalated':
        return {
          icon: ArrowUpCircle,
          label: 'Escaladé',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      case 'closed':
        return {
          icon: XCircle,
          label: 'Fermé',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        };
      default:
        return {
          icon: FileText,
          label: status,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'deposit_return': 'Restitution dépôt de garantie',
      'inventory_disagreement': 'Désaccord état des lieux',
      'unpaid_rent': 'Impayés de loyer',
      'maintenance_not_done': 'Maintenance non effectuée',
      'nuisance': 'Nuisances',
      'early_termination': 'Résiliation anticipée',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => ['open', 'assigned', 'under_mediation', 'awaiting_response'].includes(d.status)).length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    escalated: disputes.filter(d => d.status === 'escalated').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Litiges</h1>
              <p className="text-gray-600">Gérez vos litiges et suivez les médiations</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total" value={stats.total} color="gray" />
            <StatCard label="En cours" value={stats.open} color="blue" />
            <StatCard label="Résolus" value={stats.resolved} color="green" />
            <StatCard label="Escaladés" value={stats.escalated} color="red" />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <FilterButton
              label="Tous"
              active={filter === 'all'}
              count={stats.total}
              onClick={() => setFilter('all')}
            />
            <FilterButton
              label="En cours"
              active={filter === 'open'}
              count={stats.open}
              onClick={() => setFilter('open')}
            />
            <FilterButton
              label="Résolus"
              active={filter === 'resolved'}
              count={stats.resolved}
              onClick={() => setFilter('resolved')}
            />
          </div>
        </div>

        {/* Empty State */}
        {disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aucun litige
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "Vous n'avez aucun litige en cours ou passé."
                : filter === 'open'
                ? "Vous n'avez aucun litige en cours."
                : "Vous n'avez aucun litige résolu."}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-2">
                Comment fonctionne la médiation ?
              </h3>
              <p className="text-blue-800 text-sm">
                Si vous rencontrez un problème avec votre propriétaire ou locataire,
                vous pouvez ouvrir un litige. Un médiateur certifié examinera la situation
                et proposera une solution équitable. 75% des litiges sont résolus par médiation !
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <DisputeCard
                key={dispute.id}
                dispute={dispute}
                currentUserId={profile!.id}
                getStatusInfo={getStatusInfo}
                getDisputeTypeLabel={getDisputeTypeLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'green' | 'red';
}) {
  const colors = {
    gray: 'from-gray-500 to-gray-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className={`text-2xl font-bold bg-gradient-to-r ${colors[color]} text-transparent bg-clip-text mb-1`}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  count,
  onClick
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
        }
      `}
    >
      {label} ({count})
    </button>
  );
}

function DisputeCard({
  dispute,
  currentUserId,
  getStatusInfo,
  getDisputeTypeLabel
}: {
  dispute: any;
  currentUserId: string;
  getStatusInfo: (status: string) => any;
  getDisputeTypeLabel: (type: string) => string;
}) {
  const statusInfo = getStatusInfo(dispute.status);
  const StatusIcon = statusInfo.icon;
  const isOpener = dispute.opened_by === currentUserId;
  const otherParty = isOpener ? dispute.opponent : dispute.opener;
  const property = dispute.leases?.properties;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <Link
      to={`/dispute/${dispute.id}`}
      className={`
        block bg-white rounded-lg shadow-md hover:shadow-lg transition-all
        border-l-4 ${statusInfo.border}
      `}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {dispute.dispute_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {getDisputeTypeLabel(dispute.dispute_type)}
                </p>
              </div>
            </div>

            {property && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Propriété:</span> {property.title}
                </p>
                <p className="text-xs text-gray-500">{property.address}</p>
              </div>
            )}

            <p className="text-gray-700 line-clamp-2 mb-3">
              {dispute.description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Ouvert le {formatDate(dispute.opened_at)}
              </span>
              {otherParty && (
                <span>
                  <span className="font-medium">
                    {isOpener ? 'Contre' : 'Par'}:
                  </span>{' '}
                  {otherParty.first_name} {otherParty.last_name}
                </span>
              )}
              {dispute.amount_disputed && (
                <span className="font-semibold text-orange-600">
                  Montant: {formatAmount(dispute.amount_disputed)}
                </span>
              )}
            </div>
          </div>

          <div className="ml-4">
            <span className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}
            `}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </span>

            {dispute.urgency === 'urgent' && (
              <span className="block mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full text-center font-semibold">
                🔴 URGENT
              </span>
            )}
          </div>
        </div>

        {dispute.trust_agents && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Médiateur:</span> {dispute.trust_agents.full_name}
            </p>
          </div>
        )}

        {dispute.resolution_proposed && dispute.status === 'awaiting_response' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">
                  Proposition de résolution en attente de votre réponse
                </p>
                <p className="text-sm text-yellow-800">
                  Cliquez pour voir la proposition et répondre
                </p>
              </div>
            </div>
          </div>
        )}

        {dispute.status === 'resolved' && dispute.resolved_at && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 mb-1">
                  Litige résolu le {formatDate(dispute.resolved_at)}
                </p>
                {dispute.resolution_final && (
                  <p className="text-sm text-green-800">
                    {dispute.resolution_final}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {dispute.status === 'escalated' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <ArrowUpCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">
                  Litige escaladé vers {dispute.escalated_to === 'ansut_arbitration' ? 'arbitrage ANSUT' :
                                       dispute.escalated_to === 'external_arbitration' ? 'arbitrage externe' :
                                       'tribunal'}
                </p>
                {dispute.escalation_reason && (
                  <p className="text-sm text-red-800">
                    {dispute.escalation_reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
