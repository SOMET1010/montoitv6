# 🎭 Guide Multi-Rôles - Mon Toit Platform

**Date**: 30 Octobre 2025
**Status**: Documentation & Implémentation

---

## 🎯 Cas d'Usage

**Question**: Est-ce qu'un profil peut avoir deux rôles ? Par exemple, être locataire ET propriétaire ?

**Réponse**: OUI ! Voici comment ça fonctionne :

---

## 📊 Structure Actuelle de la Base de Données

### Table `profiles`
```sql
- user_type: 'locataire' | 'proprietaire' | 'agence' | 'admin_ansut'
- active_role: text (nouveau - rôle actuellement actif)
```

### Table `user_roles`
```sql
- user_id: uuid
- role: enum ('admin', 'user', 'agent', 'moderator')
- created_at: timestamptz
```

**Note**: Il y a actuellement deux systèmes de rôles :
1. **user_type** : Type de profil métier (locataire, proprietaire, agence)
2. **user_role** : Rôle système (admin, user, agent, moderator)

---

## 💡 Solution Proposée

### Approche 1 : Utiliser le champ `active_role` (RECOMMANDÉ)

Au lieu de créer une table complexe, on utilise le champ `active_role` qui permet à un utilisateur de basculer entre différents types.

#### Comment ça marche :

1. **À l'inscription** : L'utilisateur choisit son profil principal
   ```typescript
   // Profil créé avec user_type = 'locataire'
   profile.user_type = 'locataire'
   profile.active_role = 'locataire'  // Par défaut = user_type
   ```

2. **Devenir aussi propriétaire** : L'utilisateur ajoute un bien
   ```typescript
   // Quand l'utilisateur publie sa première propriété
   profile.active_role = 'proprietaire'  // Bascule automatique
   // user_type reste 'locataire' pour l'historique
   ```

3. **Basculer entre rôles** : Via un sélecteur dans l'UI
   ```typescript
   // L'utilisateur peut choisir sa vue active
   await supabase.rpc('switch_active_role', { new_role: 'locataire' })
   // ou
   await supabase.rpc('switch_active_role', { new_role: 'proprietaire' })
   ```

---

## 🔧 Implémentation Frontend

### 1. Composant de Sélection de Rôle

```typescript
// src/components/RoleSwitcher.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Building2, RefreshCw } from 'lucide-react';

export default function RoleSwitcher() {
  const { profile, refreshProfile } = useAuth();
  const [switching, setSwitching] = useState(false);

  // Déterminer les rôles disponibles pour cet utilisateur
  const getAvailableRoles = () => {
    const roles = [];

    // Le rôle principal est toujours disponible
    roles.push(profile.user_type);

    // TODO: Vérifier si l'utilisateur a des propriétés
    // Si oui, il peut être proprietaire
    if (profile.user_type === 'locataire') {
      // Check si a des propriétés
      roles.push('proprietaire');
    }

    return roles;
  };

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
      }
    } catch (err) {
      console.error('Erreur changement de rôle:', err);
    } finally {
      setSwitching(false);
    }
  };

  const roles = getAvailableRoles();

  if (roles.length <= 1) return null;

  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-3">
        <div className="text-xs text-gray-600 mb-2 font-medium">
          Vous êtes connecté en tant que:
        </div>

        <div className="flex space-x-2">
          {roles.map((role) => {
            const isActive = profile.active_role === role;

            return (
              <button
                key={role}
                onClick={() => !isActive && switchRole(role)}
                disabled={switching || isActive}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-terracotta-500 to-coral-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              >
                {role === 'locataire' && <User className="h-4 w-4" />}
                {role === 'proprietaire' && <Building2 className="h-4 w-4" />}
                {switching && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span className="capitalize">{role}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### 2. Détection Automatique des Rôles Disponibles

```typescript
// src/hooks/useUserRoles.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useUserRoles() {
  const { user, profile } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const detectRoles = async () => {
      const roles = [profile.user_type]; // Rôle principal toujours dispo

      // Vérifier si l'utilisateur a des propriétés
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if (propertyCount && propertyCount > 0) {
        // A des propriétés = peut être propriétaire
        if (!roles.includes('proprietaire')) {
          roles.push('proprietaire');
        }
      }

      // Vérifier si l'utilisateur a des baux actifs en tant que locataire
      const { count: leaseCount } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.id)
        .eq('status', 'actif');

      if (leaseCount && leaseCount > 0) {
        // A un bail actif = peut être locataire
        if (!roles.includes('locataire')) {
          roles.push('locataire');
        }
      }

      setAvailableRoles(roles);
      setLoading(false);
    };

    detectRoles();
  }, [user, profile]);

  return { availableRoles, loading };
}
```

### 3. Mise à jour de AuthContext

```typescript
// Ajouter dans src/contexts/AuthContext.tsx

const switchRole = async (newRole: string) => {
  if (!user) return;

  try {
    const { data, error } = await supabase.rpc('switch_active_role', {
      new_role: newRole
    });

    if (error) throw error;

    if (data.success) {
      // Recharger le profil
      await refreshProfile();
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// Ajouter à l'interface AuthContextType
interface AuthContextType {
  // ... existing properties
  switchRole: (newRole: string) => Promise<{ success: boolean; error?: string }>;
  availableRoles?: string[];
}
```

---

## 🎨 Intégration UI

### Dans le Header

```tsx
// src/components/Header.tsx
import RoleSwitcher from './RoleSwitcher';

// Ajouter dans le header après l'avatar
{profile && (
  <RoleSwitcher />
)}
```

### Dans le Dashboard

```tsx
// Afficher un banner si l'utilisateur peut avoir plusieurs rôles
{availableRoles.length > 1 && (
  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-4 mb-6">
    <div className="flex items-start space-x-3">
      <Info className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 text-sm mb-1">
          Vous avez plusieurs profils
        </h4>
        <p className="text-gray-600 text-xs mb-3">
          Vous pouvez basculer entre vos différents rôles à tout moment.
        </p>
        <RoleSwitcher />
      </div>
    </div>
  </div>
)}
```

---

## 📝 Scénarios d'Usage

### Scénario 1 : Locataire devient Propriétaire

**Étapes** :
1. Jean s'inscrit comme **locataire**
2. Jean trouve un appartement et signe un bail
3. Plus tard, Jean achète un studio et veut le louer
4. Jean clique sur "Publier une propriété"
5. Système détecte : "Vous allez publier comme propriétaire"
6. Jean peut maintenant basculer entre locataire/propriétaire

**Code** :
```typescript
// Dans AddProperty.tsx
const handleFirstProperty = async () => {
  // Si user_type = locataire et c'est la première propriété
  if (profile.user_type === 'locataire') {
    const { data } = await supabase.rpc('switch_active_role', {
      new_role: 'proprietaire'
    });

    if (data.success) {
      showNotification('Vous êtes maintenant aussi propriétaire !');
    }
  }
};
```

### Scénario 2 : Propriétaire cherche un nouveau logement

**Étapes** :
1. Marie est **propriétaire** de 3 appartements
2. Marie déménage et cherche un nouveau logement
3. Marie bascule vers le rôle **locataire**
4. L'interface change pour montrer la recherche de logement
5. Marie peut revenir en mode propriétaire quand elle veut

**Code** :
```typescript
// Click sur le bouton "Mode Locataire"
await switchRole('locataire');
// Redirection automatique vers /recherche
```

---

## 🔐 Gestion des Permissions

### RLS avec Active Role

```sql
-- Exemple : Seuls les propriétaires (active_role) peuvent modifier leurs propriétés
CREATE POLICY "Owners can update their properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND active_role = 'proprietaire'
    )
  );

-- Exemple : Les locataires actifs peuvent voir leurs candidatures
CREATE POLICY "Active tenants can view their applications"
  ON rental_applications FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (active_role = 'locataire' OR user_type = 'locataire')
    )
  );
```

---

## ⚙️ Base de Données - Migration Simplifiée

```sql
-- Migration simple pour ajouter active_role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_role text;

-- Initialiser avec user_type
UPDATE profiles SET active_role = user_type WHERE active_role IS NULL;

-- Fonction de changement de rôle
CREATE OR REPLACE FUNCTION switch_active_role(new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
BEGIN
  -- Mettre à jour le rôle actif
  UPDATE profiles
  SET active_role = new_role,
      updated_at = now()
  WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'active_role', new_role
  );
END;
$$;
```

---

## 📱 Exemples d'Interface

### Notification de Nouveau Rôle

```tsx
// Quand un locataire publie sa première propriété
<div className="fixed top-20 right-4 z-50 animate-slide-down">
  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl p-6 max-w-md">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
        <Building2 className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-1">
          Félicitations ! 🎉
        </h3>
        <p className="text-sm text-white/90 mb-3">
          Vous êtes maintenant aussi <strong>propriétaire</strong> sur Mon Toit.
          Vous pouvez basculer entre vos deux profils à tout moment.
        </p>
        <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition">
          Compris !
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 🎯 Résumé

**Avantages de cette approche** :

✅ **Simple** : Un seul champ `active_role` à gérer
✅ **Flexible** : L'utilisateur peut basculer à tout moment
✅ **Intuitif** : UI claire avec sélecteur de rôle
✅ **Performant** : Pas de jointures complexes
✅ **Évolutif** : Facile d'ajouter d'autres types

**Cas d'usage couverts** :

- ✅ Locataire qui devient propriétaire
- ✅ Propriétaire qui cherche un logement
- ✅ Utilisateur avec plusieurs activités
- ✅ Changement de contexte rapide

---

## 📊 Statistiques d'Usage

Pour tracker l'adoption multi-rôles :

```sql
-- Combien d'utilisateurs ont plusieurs rôles actifs ?
SELECT
  user_type as role_principal,
  active_role as role_actif,
  COUNT(*) as nombre_utilisateurs
FROM profiles
WHERE active_role != user_type
GROUP BY user_type, active_role;

-- Quels utilisateurs basculent souvent ?
-- (Nécessite un tracking des changements)
```

---

**Prêt à implémenter ! 🚀**

Cette approche simple et efficace permet une vraie flexibilité multi-rôles sans complexifier la base de données.
