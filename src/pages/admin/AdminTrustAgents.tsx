import { useState, useEffect } from 'react';
import { Shield, UserPlus, Edit, Pause, Play, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminTrustAgents() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trust_agents')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé</h2>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (showCreate) {
    return (
      <CreateAgentForm
        onBack={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          loadAgents();
        }}
      />
    );
  }

  if (selectedAgent) {
    return (
      <AgentDetail
        agent={selectedAgent}
        onBack={() => {
          setSelectedAgent(null);
          loadAgents();
        }}
        onUpdate={loadAgents}
      />
    );
  }

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    onLeave: agents.filter(a => a.status === 'on_leave').length,
    avgSatisfaction: agents.length > 0
      ? agents.reduce((acc, a) => acc + (a.satisfaction_score || 0), 0) / agents.length
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion Équipe</h1>
                <p className="text-gray-600">Agents Tiers de Confiance</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un agent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Shield} label="Total agents" value={stats.total} color="indigo" />
          <StatCard icon={Play} label="Actifs" value={stats.active} color="green" />
          <StatCard icon={Pause} label="En congé" value={stats.onLeave} color="orange" />
          <StatCard icon={Award} label="Satisfaction moy." value={`${stats.avgSatisfaction.toFixed(1)}/5`} color="yellow" />
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucun agent dans l'équipe</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Ajouter le premier agent
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => setSelectedAgent(agent)}
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
    indigo: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Icon className={`w-8 h-8 bg-gradient-to-r ${colors[color]} text-white p-1.5 rounded-lg mb-3`} />
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function AgentCard({ agent, onClick }: any) {
  const getStatusBadge = () => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      on_leave: 'bg-orange-100 text-orange-700',
      suspended: 'bg-red-100 text-red-700'
    };
    const labels = {
      active: 'Actif',
      on_leave: 'En congé',
      suspended: 'Suspendu'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[agent.status as keyof typeof styles]}`}>
        {labels[agent.status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{agent.full_name}</h3>
              <p className="text-sm text-gray-600">{agent.email}</p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Validations</p>
              <p className="font-semibold text-indigo-600">{agent.total_validations}</p>
            </div>
            <div>
              <p className="text-gray-600">Médiations</p>
              <p className="font-semibold text-green-600">{agent.total_mediations}</p>
            </div>
            <div>
              <p className="text-gray-600">Temps moy.</p>
              <p className="font-semibold text-gray-900">{agent.avg_validation_time_hours?.toFixed(1) || 0}h</p>
            </div>
            <div>
              <p className="text-gray-600">Satisfaction</p>
              <p className="font-semibold text-yellow-600">{agent.satisfaction_score?.toFixed(1) || 0}/5</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {agent.specialties?.map((s: string) => (
              <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>

        <button className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CreateAgentForm({ onBack, onSuccess }: any) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    specialties: [] as string[],
    canValidate: true,
    canMediate: false,
    canModerate: false,
    salaryType: 'hybrid',
    salaryFixedAmount: 200000,
    commissionRate: 0.005
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: true
      });

      if (userError) throw userError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userData.user.id,
          email: formData.email,
          first_name: formData.fullName.split(' ')[0],
          last_name: formData.fullName.split(' ').slice(1).join(' '),
          phone: formData.phone,
          role: 'admin'
        });

      if (profileError) throw profileError;

      const { error: agentError } = await supabase
        .from('trust_agents')
        .insert({
          user_id: userData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          specialties: formData.specialties,
          can_validate: formData.canValidate,
          can_mediate: formData.canMediate,
          can_moderate: formData.canModerate,
          salary_type: formData.salaryType,
          salary_fixed_amount: formData.salaryFixedAmount,
          commission_rate: formData.commissionRate
        });

      if (agentError) throw agentError;

      alert('Agent créé avec succès !');
      onSuccess();
    } catch (err: any) {
      console.error('Erreur:', err);
      alert(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium">
          ← Retour
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajouter un Agent</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Spécialités
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes('validation')}
                    onChange={() => toggleSpecialty('validation')}
                    className="w-4 h-4"
                  />
                  <span>Validation manuelle</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes('mediation')}
                    onChange={() => toggleSpecialty('mediation')}
                    className="w-4 h-4"
                  />
                  <span>Médiation de litiges</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes('moderation')}
                    onChange={() => toggleSpecialty('moderation')}
                    className="w-4 h-4"
                  />
                  <span>Modération d'annonces</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rémunération
              </label>
              <select
                value={formData.salaryType}
                onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              >
                <option value="fixed">Fixe uniquement</option>
                <option value="commission">Commission uniquement</option>
                <option value="hybrid">Hybride (Fixe + Commission)</option>
              </select>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Fixe (FCFA/mois)</label>
                  <input
                    type="number"
                    value={formData.salaryFixedAmount}
                    onChange={(e) => setFormData({ ...formData, salaryFixedAmount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Commission (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commissionRate * 100}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
              >
                {submitting ? 'Création...' : 'Créer l\'agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AgentDetail({ agent, onBack, onUpdate }: any) {
  const [status, setStatus] = useState(agent.status);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('trust_agents')
        .update({ status: newStatus })
        .eq('id', agent.id);

      if (error) throw error;
      setStatus(newStatus);
      alert('Statut mis à jour');
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium">
          ← Retour
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{agent.full_name}</h2>
            <select
              value={status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={updating}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="active">Actif</option>
              <option value="on_leave">En congé</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Informations</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-600">Email:</span> {agent.email}</p>
                <p className="text-sm"><span className="text-gray-600">Téléphone:</span> {agent.phone}</p>
                <p className="text-sm"><span className="text-gray-600">Embauché le:</span> {new Date(agent.hired_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Performance</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-600">Validations:</span> {agent.total_validations}</p>
                <p className="text-sm"><span className="text-gray-600">Médiations:</span> {agent.total_mediations}</p>
                <p className="text-sm"><span className="text-gray-600">Satisfaction:</span> {agent.satisfaction_score?.toFixed(1)}/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
