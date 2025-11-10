import React, { useState, useEffect } from 'react';
import { Shield, Search, Save, AlertCircle, CheckCircle, User, Crown, Building2, Users as UsersIcon, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active_role: string;
  user_type: string;
  trust_verified: boolean;
  is_verified: boolean;
}

export default function AdminUserRoles() {
  const { user } = useAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [makeTrustAgent, setMakeTrustAgent] = useState(false);

  const availableRoles = [
    { value: 'locataire', label: 'Locataire', icon: User, color: 'cyan' },
    { value: 'proprietaire', label: 'Propriétaire', icon: Building2, color: 'orange' },
    { value: 'agence', label: 'Agence', icon: UsersIcon, color: 'green' },
    { value: 'admin', label: 'Administrateur', icon: Crown, color: 'blue' },
    { value: 'trust_agent', label: 'Trust Agent', icon: UserCheck, color: 'purple' },
  ];

  const userTypes = [
    { value: 'locataire', label: 'Locataire' },
    { value: 'proprietaire', label: 'Propriétaire' },
    { value: 'agence', label: 'Agence' },
    { value: 'admin_ansut', label: 'Admin ANSUT' },
  ];

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un email' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setFoundUser(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, active_role, user_type, trust_verified, is_verified')
        .eq('email', searchEmail.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage({ type: 'error', text: 'Utilisateur non trouvé' });
        return;
      }

      setFoundUser(data);

      // Pré-remplir les rôles actuels
      const currentRoles = data.role ? data.role.split(',') : [];
      setSelectedRoles(currentRoles);
      setSelectedUserType(data.user_type || 'locataire');
      setMakeAdmin(currentRoles.includes('admin') || data.user_type === 'admin_ansut');
      setMakeTrustAgent(currentRoles.includes('trust_agent'));

      setMessage({ type: 'success', text: 'Utilisateur trouvé !' });
    } catch (err: any) {
      console.error('Erreur recherche utilisateur:', err);
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la recherche' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const saveRoles = async () => {
    if (!foundUser) return;

    setSaving(true);
    setMessage(null);

    try {
      // Construire la liste des rôles
      let rolesToSave = [...selectedRoles];

      if (makeAdmin && !rolesToSave.includes('admin')) {
        rolesToSave.push('admin');
      }
      if (makeTrustAgent && !rolesToSave.includes('trust_agent')) {
        rolesToSave.push('trust_agent');
      }

      // S'assurer que le user_type est dans les rôles
      if (!rolesToSave.includes(selectedUserType)) {
        rolesToSave.push(selectedUserType);
      }

      const rolesString = rolesToSave.join(',');

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: rolesString,
          user_type: makeAdmin ? 'admin_ansut' : selectedUserType,
          active_role: makeAdmin ? 'admin' : (rolesToSave[0] || selectedUserType),
          trust_verified: makeTrustAgent,
          trust_score: makeTrustAgent ? 100 : foundUser.trust_verified ? 100 : null,
          is_verified: makeAdmin || makeTrustAgent ? true : foundUser.is_verified,
        })
        .eq('id', foundUser.id);

      if (profileError) throw profileError;

      // Si Trust Agent, ajouter à la table trust_agents
      if (makeTrustAgent) {
        const { error: trustAgentError } = await supabase
          .from('trust_agents')
          .upsert({
            user_id: foundUser.id,
            full_name: foundUser.full_name,
            email: foundUser.email,
            status: 'active',
            specialties: ['verification', 'mediation', 'validation'],
            languages: ['fr'],
            can_validate: true,
            can_mediate: true,
            can_moderate: true,
            can_manage_agents: makeAdmin,
            salary_type: 'commission',
            commission_rate: 5.0,
            hired_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (trustAgentError) console.error('Erreur Trust Agent:', trustAgentError);
      }

      setMessage({
        type: 'success',
        text: `Rôles mis à jour avec succès pour ${foundUser.email} !`
      });

      // Rafraîchir les données
      await searchUser();
    } catch (err: any) {
      console.error('Erreur sauvegarde rôles:', err);
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Rôles Utilisateurs
              </h1>
              <p className="text-gray-600">
                Attribuer des rôles et permissions aux utilisateurs
              </p>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Rechercher un Utilisateur
          </h2>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="email"
                placeholder="email@exemple.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchUser}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>

        {/* Utilisateur trouvé */}
        {foundUser && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Utilisateur Trouvé
            </h2>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom Complet</p>
                  <p className="font-bold text-gray-900">{foundUser.full_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-bold text-gray-900">{foundUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rôles Actuels</p>
                  <p className="font-bold text-gray-900">{foundUser.role || 'Aucun'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type Utilisateur</p>
                  <p className="font-bold text-gray-900">{foundUser.user_type || 'Non défini'}</p>
                </div>
              </div>
            </div>

            {/* Sélection Type Utilisateur */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Type d'Utilisateur Principal
              </h3>
              <div className="grid md:grid-cols-4 gap-3">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedUserType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedUserType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-center">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection Rôles */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Rôles Additionnels
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {availableRoles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRoles.includes(role.value);

                  return (
                    <button
                      key={role.value}
                      onClick={() => toggleRole(role.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isSelected
                          ? `border-${role.color}-500 bg-${role.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isSelected ? `bg-${role.color}-500` : 'bg-gray-200'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{role.label}</p>
                        {isSelected && (
                          <p className="text-xs text-gray-600">Actif</p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        isSelected ? `bg-${role.color}-500 border-${role.color}-500` : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options Spéciales */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Permissions Spéciales
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={makeAdmin}
                    onChange={(e) => setMakeAdmin(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-blue-900">Administrateur Principal</p>
                    <p className="text-sm text-blue-700">Accès complet à toutes les fonctionnalités admin</p>
                  </div>
                  <Crown className="w-6 h-6 text-blue-600" />
                </label>

                <label className="flex items-center gap-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={makeTrustAgent}
                    onChange={(e) => setMakeTrustAgent(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-purple-900">Trust Agent</p>
                    <p className="text-sm text-purple-700">Validation, médiation et modération</p>
                  </div>
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </label>
              </div>
            </div>

            {/* Bouton Sauvegarder */}
            <div className="flex justify-end">
              <button
                onClick={saveRoles}
                disabled={saving}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les Rôles'}
              </button>
            </div>
          </div>
        )}

        {/* Guide Rapide */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Guide Rapide
          </h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <p>Entrez l'email de l'utilisateur et cliquez sur "Rechercher"</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <p>Sélectionnez le type d'utilisateur principal</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <p>Cochez les rôles additionnels souhaités</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <p>Activez "Administrateur" ou "Trust Agent" si nécessaire</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
              <p>Cliquez sur "Sauvegarder les Rôles"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
