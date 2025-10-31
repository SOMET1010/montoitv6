import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';
import { cevService, type CEVRequest } from '../services/cevService';

export default function AdminCEVManagement() {

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<CEVRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CEVRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, analyticsData] = await Promise.all([
        cevService.getAllCEVRequests(),
        cevService.getCEVAnalytics(),
      ]);
      setRequests(requestsData);
      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.cev_number?.toLowerCase().includes(term) ||
          req.oneci_reference_number?.toLowerCase().includes(term) ||
          (req as any).landlord?.full_name?.toLowerCase().includes(term) ||
          (req as any).tenant?.full_name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: CEVRequest['status']) => {
    const statusConfig = {
      pending_documents: {
        label: 'Documents en attente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      submitted: {
        label: 'Soumis',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock,
      },
      under_review: {
        label: 'En révision',
        color: 'bg-purple-100 text-purple-800',
        icon: Clock,
      },
      documents_requested: {
        label: 'Documents requis',
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
      },
      approved: {
        label: 'Approuvé',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      issued: {
        label: 'Émis',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      rejected: {
        label: 'Rejeté',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending_documents;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getStatusCounts = () => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending_documents').length,
      submitted: requests.filter((r) => r.status === 'submitted').length,
      under_review: requests.filter((r) => r.status === 'under_review').length,
      issued: requests.filter((r) => r.status === 'issued').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    };
  };

  const calculateRevenue = () => {
    return requests
      .filter((r) => r.cev_fee_paid)
      .reduce((sum, r) => sum + r.cev_fee_amount, 0);
  };

  const calculateApprovalRate = () => {
    const total = requests.filter(
      (r) => r.status === 'issued' || r.status === 'rejected'
    ).length;
    const approved = requests.filter((r) => r.status === 'issued').length;
    return total > 0 ? ((approved / total) * 100).toFixed(1) : '0';
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

  const counts = getStatusCounts();
  const revenue = calculateRevenue();
  const approvalRate = calculateApprovalRate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion CEV ONECI</h1>
                <p className="text-sm text-gray-600">
                  Administration des certifications électroniques validées
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total demandes</p>
                <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">CEV émis</p>
                <p className="text-2xl font-bold text-gray-900">{counts.issued}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Taux d'approbation</p>
                <p className="text-2xl font-bold text-gray-900">{approvalRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenus</p>
                <p className="text-2xl font-bold text-gray-900">
                  {revenue.toLocaleString('fr-FR')} F
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro CEV, référence ONECI, nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending_documents">Documents en attente</option>
                <option value="submitted">Soumis</option>
                <option value="under_review">En révision</option>
                <option value="documents_requested">Documents requis</option>
                <option value="approved">Approuvé</option>
                <option value="issued">Émis</option>
                <option value="rejected">Rejeté</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-5 w-5" />
                Exporter
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucune demande CEV trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Référence
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Propriétaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Locataire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Bien
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Numéro CEV
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request: any) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-mono font-medium text-gray-900">
                            {request.oneci_reference_number || 'En attente'}
                          </p>
                          <p className="text-xs text-gray-500">{request.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {request.landlord?.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{request.landlord?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {request.tenant?.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{request.tenant?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {request.property?.title || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.property?.address?.slice(0, 30)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {request.cev_number ? (
                            <span className="font-mono font-medium text-green-700">
                              {request.cev_number}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => window.location.href = `/cev-request/${request.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
