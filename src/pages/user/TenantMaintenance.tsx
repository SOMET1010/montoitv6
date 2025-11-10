import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Wrench, Plus, Clock, CheckCircle, XCircle, Calendar, AlertCircle } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  issue_type: string;
  urgency: string;
  description: string;
  status: string;
  images: string[];
  scheduled_date: string | null;
  resolved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  properties: {
    title: string;
    address: string;
  };
}

export default function TenantMaintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'en_cours' | 'resolue'>('all');

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadRequests();
  }, [user, filter]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('maintenance_requests')
        .select('*, properties(title, address)')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      en_attente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      acceptee: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Acceptée' },
      en_cours: { color: 'bg-purple-100 text-purple-800', icon: Wrench, label: 'En cours' },
      planifiee: { color: 'bg-cyan-100 text-cyan-800', icon: Calendar, label: 'Planifiée' },
      resolue: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Résolue' },
      refusee: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Refusée' }
    };

    const config = configs[status] || configs.en_attente;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </span>
    );
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[urgency] || colors.medium;
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plumbing: 'Plomberie',
      electrical: 'Électricité',
      heating: 'Chauffage',
      appliance: 'Électroménager',
      structural: 'Structure',
      other: 'Autre'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <Wrench className="w-10 h-10 text-terracotta-600" />
              <span>Mes demandes de maintenance</span>
            </h1>
            <p className="text-xl text-gray-600">Suivez l'état de vos demandes</p>
          </div>
          <a href="/maintenance/nouvelle" className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nouvelle demande</span>
          </a>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' ? 'bg-terracotta-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('en_attente')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'en_attente' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('en_cours')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'en_cours' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setFilter('resolue')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'resolue' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            Résolues
          </button>
        </div>

        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="card-scrapbook p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {getIssueTypeLabel(request.issue_type)}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-gray-600 mb-2">{request.properties.title}</p>
                  <p className="text-sm text-gray-500">{request.properties.address}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${getUrgencyColor(request.urgency)}`}>
                    {request.urgency === 'urgent' ? '🔴 URGENT' :
                     request.urgency === 'high' ? '🟠 Prioritaire' :
                     request.urgency === 'medium' ? '🟡 Moyenne' : '🟢 Faible'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{request.description}</p>

              {request.images.length > 0 && (
                <div className="flex space-x-2 mb-4">
                  {request.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-75"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}

              {request.scheduled_date && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Intervention planifiée le {new Date(request.scheduled_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {request.resolved_at && (
                <div className="p-3 bg-green-50 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Résolu le {new Date(request.resolved_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {request.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg flex items-start space-x-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800 mb-1">Raison du refus:</p>
                    <p className="text-sm text-red-700">{request.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">Aucune demande de maintenance</p>
              <p className="text-gray-500 mb-4">Commencez par créer votre première demande</p>
              <a href="/maintenance/nouvelle" className="btn-primary inline-flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nouvelle demande</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
