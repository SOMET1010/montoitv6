import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Wrench, CheckCircle, XCircle, Calendar, AlertCircle, Clock } from 'lucide-react';

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
  profiles: {
    full_name: string;
    phone: string;
  };
}

export default function OwnerMaintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'en_cours' | 'resolue'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [actionData, setActionData] = useState({
    scheduled_date: '',
    rejection_reason: ''
  });

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
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      if (!propertiesData || propertiesData.length === 0) {
        setLoading(false);
        return;
      }

      const propertyIds = propertiesData.map(p => p.id);

      let query = supabase
        .from('maintenance_requests')
        .select('*, properties(title, address), profiles(full_name, phone)')
        .in('property_id', propertyIds)
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

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'resolue') {
        updates.resolved_at = new Date().toISOString();
      }

      if (newStatus === 'planifiee' && actionData.scheduled_date) {
        updates.scheduled_date = actionData.scheduled_date;
      }

      if (newStatus === 'refusee' && actionData.rejection_reason) {
        updates.rejection_reason = actionData.rejection_reason;
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      setSelectedRequest(null);
      setActionData({ scheduled_date: '', rejection_reason: '' });
      loadRequests();
    } catch (err) {
      console.error('Error updating request:', err);
      alert('Erreur lors de la mise à jour');
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <Wrench className="w-10 h-10 text-terracotta-600" />
            <span>Demandes de maintenance</span>
          </h1>
          <p className="text-xl text-gray-600">Gérez les demandes de vos locataires</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card-scrapbook p-4">
            <p className="text-sm text-gray-600">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'en_attente').length}
            </p>
          </div>
          <div className="card-scrapbook p-4">
            <p className="text-sm text-gray-600">En cours</p>
            <p className="text-2xl font-bold text-purple-600">
              {requests.filter(r => ['acceptee', 'en_cours', 'planifiee'].includes(r.status)).length}
            </p>
          </div>
          <div className="card-scrapbook p-4">
            <p className="text-sm text-gray-600">Résolues</p>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'resolue').length}
            </p>
          </div>
          <div className="card-scrapbook p-4">
            <p className="text-sm text-gray-600">Urgentes</p>
            <p className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.urgency === 'urgent' && r.status !== 'resolue').length}
            </p>
          </div>
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
                    {request.urgency === 'urgent' && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">{request.properties.title}</p>
                  <p className="text-sm text-gray-500">Locataire: {request.profiles.full_name} - {request.profiles.phone}</p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </p>
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

              {request.status === 'en_attente' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateStatus(request.id, 'acceptee')}
                    className="btn-primary text-sm"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => setSelectedRequest(request.id)}
                    className="btn-secondary text-sm"
                  >
                    Planifier
                  </button>
                  <button
                    onClick={() => setSelectedRequest(request.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700"
                  >
                    Refuser
                  </button>
                </div>
              )}

              {['acceptee', 'en_cours', 'planifiee'].includes(request.status) && (
                <button
                  onClick={() => handleUpdateStatus(request.id, 'resolue')}
                  className="btn-primary text-sm"
                >
                  Marquer comme résolue
                </button>
              )}

              {selectedRequest === request.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Planifier intervention</label>
                      <input
                        type="date"
                        value={actionData.scheduled_date}
                        onChange={(e) => setActionData({ ...actionData, scheduled_date: e.target.value })}
                        className="input-scrapbook w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Raison du refus</label>
                      <textarea
                        value={actionData.rejection_reason}
                        onChange={(e) => setActionData({ ...actionData, rejection_reason: e.target.value })}
                        className="input-scrapbook w-full"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      {actionData.scheduled_date && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'planifiee')}
                          className="btn-primary text-sm"
                        >
                          Confirmer planification
                        </button>
                      )}
                      {actionData.rejection_reason && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'refusee')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Confirmer refus
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setActionData({ scheduled_date: '', rejection_reason: '' });
                        }}
                        className="btn-secondary text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Aucune demande de maintenance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
