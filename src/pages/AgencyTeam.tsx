import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, UserPlus, Mail, Phone, Shield, Trash2, CheckCircle,
  Clock, XCircle, Edit, Award, TrendingUp
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  commission_rate: number;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function AgencyTeam() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteCommission, setInviteCommission] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    if (!user) return;

    try {
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!agencyData) {
        window.location.href = '/agence/inscription';
        return;
      }

      setAgency(agencyData);

      const { data: membersData } = await supabase
        .from('agency_team_members')
        .select('*, profiles(full_name, email, phone)')
        .eq('agency_id', agencyData.id)
        .order('created_at', { ascending: false });

      setTeamMembers(membersData || []);
    } catch (err) {
      console.error('Error loading team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    setSubmitting(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (!profileData) {
        alert('Utilisateur non trouvé avec cet email');
        return;
      }

      const { error } = await supabase
        .from('agency_team_members')
        .insert({
          agency_id: agency.id,
          user_id: profileData.id,
          role: inviteRole,
          commission_rate: parseFloat(inviteCommission),
          status: 'invited'
        });

      if (error) throw error;

      alert('Invitation envoyée avec succès !');
      setShowInviteModal(false);
      setInviteEmail('');
      loadTeamData();
    } catch (err: any) {
      console.error('Error inviting member:', err);
      alert(err.message || 'Erreur lors de l\'invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('agency_team_members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      loadTeamData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    try {
      const { error } = await supabase
        .from('agency_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      loadTeamData();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      manager: 'Manager',
      agent: 'Agent',
      assistant: 'Assistant'
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Actif' },
      invited: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Invité' },
      suspended: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Suspendu' }
    };

    const config = configs[status] || configs.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${config.color} text-xs font-bold`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
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
              <Users className="w-10 h-10 text-terracotta-600" />
              <span>Gestion d'équipe</span>
            </h1>
            <p className="text-xl text-gray-600">{agency?.name}</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inviter un membre</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
            <p className="text-sm text-gray-600">Membres totaux</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {teamMembers.filter(m => m.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Membres actifs</p>
          </div>

          <div className="card-scrapbook p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {teamMembers.filter(m => m.status === 'invited').length}
            </p>
            <p className="text-sm text-gray-600">Invitations en attente</p>
          </div>
        </div>

        <div className="card-scrapbook p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Membre</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Rôle</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Commission</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(member => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
                          <span className="text-terracotta-600 font-bold">
                            {member.profiles?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.profiles?.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Depuis {new Date(member.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{member.profiles?.email || 'N/A'}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{member.profiles?.phone || 'N/A'}</span>
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                        <Shield className="w-3 h-3" />
                        <span>{getRoleLabel(member.role)}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-gray-900">
                        {member.commission_rate}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {member.status === 'invited' && (
                          <button
                            onClick={() => handleStatusChange(member.id, 'active')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Activer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Retirer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {teamMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">Aucun membre dans l'équipe</p>
                <p className="text-gray-500">Commencez par inviter des agents</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Inviter un membre</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du membre
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="input-scrapbook w-full"
                  placeholder="exemple@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="input-scrapbook w-full"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                  <option value="assistant">Assistant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de commission (%)
                </label>
                <input
                  type="number"
                  value={inviteCommission}
                  onChange={(e) => setInviteCommission(e.target.value)}
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  className="input-scrapbook w-full"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Envoi...' : 'Inviter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
