import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Building2, Briefcase, RefreshCw, CheckCircle, Info } from 'lucide-react';

interface AvailableRolesResponse {
  roles: string[];
  active_role: string;
  primary_role: string;
}

export default function RoleSwitcher() {
  const { profile, user, refreshProfile } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const fetchAvailableRoles = async () => {
      try {
        const { data, error } = await supabase.rpc('get_available_roles');

        if (error) throw error;

        const response = data as AvailableRolesResponse;
        setAvailableRoles(response.roles || [profile.user_type]);
      } catch (err) {
        console.error('Erreur chargement rôles:', err);
        setAvailableRoles([profile.user_type]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableRoles();
  }, [user, profile]);

  const switchRole = async (newRole: string) => {
    setSwitching(true);
    try {
      const { data, error } = await supabase.rpc('switch_active_role', {
        new_role: newRole
      });

      if (error) throw error;

      if (data.success) {
        await refreshProfile();

        // Rediriger vers le dashboard approprié
        if (newRole === 'locataire') {
          window.location.href = '/';
        } else if (newRole === 'proprietaire') {
          window.location.href = '/dashboard/proprietaire';
        } else if (newRole === 'agence') {
          window.location.href = '/agence/dashboard';
        }
      } else {
        alert(data.error || 'Erreur lors du changement de rôle');
      }
    } catch (err: any) {
      console.error('Erreur changement de rôle:', err);
      alert('Erreur lors du changement de rôle');
    } finally {
      setSwitching(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'locataire':
        return User;
      case 'proprietaire':
        return Building2;
      case 'agence':
        return Briefcase;
      default:
        return User;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'locataire':
        return 'Locataire';
      case 'proprietaire':
        return 'Propriétaire';
      case 'agence':
        return 'Agence';
      case 'admin_ansut':
        return 'Admin ANSUT';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'locataire':
        return 'from-cyan-500 to-blue-500';
      case 'proprietaire':
        return 'from-terracotta-500 to-coral-500';
      case 'agence':
        return 'from-olive-500 to-green-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading || !profile) return null;

  // Ne rien afficher si un seul rôle
  if (availableRoles.length <= 1) return null;

  const activeRole = profile.active_role || profile.user_type;

  return (
    <div className="relative">
      {/* Version compacte pour le header */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-600 font-medium">
            Profil actif
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Info className="h-3 w-3 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableRoles.map((role) => {
            const Icon = getRoleIcon(role);
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => !isActive && switchRole(role)}
                disabled={switching || isActive}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all
                  ${
                    isActive
                      ? `bg-gradient-to-r ${getRoleColor(role)} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }
                  ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                  transform
                `}
              >
                {switching && isActive ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Icon className="h-4 w-4" />
                    {isActive && <CheckCircle className="h-3 w-3" />}
                  </>
                )}
                <span>{getRoleLabel(role)}</span>
              </button>
            );
          })}
        </div>

        {showInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Vous avez plusieurs profils. Cliquez pour basculer entre vos rôles
                    et accéder aux fonctionnalités correspondantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
