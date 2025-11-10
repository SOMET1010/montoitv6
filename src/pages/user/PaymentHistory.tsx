import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DollarSign, Download, Eye, Filter, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  status: string;
  created_at: string;
  payer: {
    full_name: string;
  };
  receiver: {
    full_name: string;
  };
  property: {
    title: string;
    address: string;
    city: string;
  };
}

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'complete' | 'echoue'>('all');

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user, filter, statusFilter]);

  const loadPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_type,
          payment_method,
          status,
          created_at,
          payer:profiles!payments_payer_id_fkey(full_name),
          receiver:profiles!payments_receiver_id_fkey(full_name),
          property:properties(title, address, city)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'sent') {
        query = query.eq('payer_id', user?.id);
      } else if (filter === 'received') {
        query = query.eq('receiver_id', user?.id);
      } else {
        query = query.or(`payer_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedPayments = (data || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        payment_method: payment.payment_method,
        status: payment.status,
        created_at: payment.created_at,
        payer: payment.payer,
        receiver: payment.receiver,
        property: payment.property
      }));

      setPayments(formattedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'echoue':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'en_attente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      complete: 'bg-green-100 text-green-800 border-green-300',
      echoue: 'bg-red-100 text-red-800 border-red-300',
      annule: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const labels = {
      en_attente: 'En attente',
      complete: 'Complété',
      echoue: 'Échoué',
      annule: 'Annulé'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      loyer: 'Loyer',
      depot_garantie: 'Dépôt de garantie',
      charges: 'Charges',
      frais_agence: 'Frais d\'agence'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      mobile_money: 'Mobile Money',
      carte_bancaire: 'Carte bancaire',
      virement: 'Virement',
      especes: 'Espèces'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = () => {
    return payments
      .filter(p => p.status === 'complete')
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour voir votre historique de paiements
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-coral-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">Historique des paiements</h1>
            <p className="text-gray-600 text-lg">Gérez et consultez tous vos paiements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium">Total payé</span>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gradient">
                {calculateTotal().toLocaleString()} FCFA
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium">Paiements</span>
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gradient">
                {payments.filter(p => p.status === 'complete').length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium">En attente</span>
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gradient">
                {payments.filter(p => p.status === 'en_attente').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-bold text-gray-900">Filtres:</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 font-medium"
                >
                  <option value="all">Tous les paiements</option>
                  <option value="sent">Envoyés</option>
                  <option value="received">Reçus</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 font-medium"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="complete">Complété</option>
                  <option value="echoue">Échoué</option>
                </select>
              </div>

              <a
                href="/effectuer-paiement"
                className="btn-primary px-6 py-2 flex items-center space-x-2"
              >
                <DollarSign className="w-5 h-5" />
                <span>Nouveau paiement</span>
              </a>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun paiement
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore effectué de paiement
              </p>
              <a href="/effectuer-paiement" className="btn-primary">
                Effectuer un paiement
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center space-x-3 mb-3">
                        {getStatusIcon(payment.status)}
                        <h3 className="text-lg font-bold text-gray-900">
                          {payment.property?.title || 'Paiement'}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <span className="font-medium">Type:</span>
                          <span>{getPaymentTypeLabel(payment.payment_type)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <span className="font-medium">Méthode:</span>
                          <span>{getPaymentMethodLabel(payment.payment_method)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(payment.created_at)}</span>
                        </div>
                        {payment.property && (
                          <div className="text-gray-600">
                            <span className="font-medium">Propriété:</span> {payment.property.address}, {payment.property.city}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-start space-y-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gradient">
                          {payment.amount.toLocaleString()} FCFA
                        </p>
                        <p className="text-xs text-gray-500">
                          {filter === 'sent' || !filter ? 'À ' + payment.receiver.full_name : 'De ' + payment.payer.full_name}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/paiement/${payment.id}`}
                          className="p-2 text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                          title="Télécharger le reçu"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
