# 🛡️ Guide : Attribuer des Rôles Administrateur

Il existe **2 façons** de créer un administrateur ou attribuer des rôles :

---

## 🎨 Méthode 1 : Interface Graphique (RECOMMANDÉ)

### Accès
```
URL: /admin/gestion-roles
```

### Étapes

1. **Connectez-vous en tant qu'admin**
2. Allez dans le menu **Admin** → **Attribuer des Rôles**
3. **Recherchez l'utilisateur** par son email
4. **Sélectionnez** :
   - Type d'utilisateur principal
   - Rôles additionnels
   - Cochez "Administrateur Principal" pour accès complet
   - Cochez "Trust Agent" pour validation/médiation
5. **Cliquez** sur "Sauvegarder les Rôles"

### Avantages
✅ Interface visuelle intuitive
✅ Pas besoin de SQL
✅ Validation automatique
✅ Historique des modifications

---

## 💻 Méthode 2 : Requête SQL Directe

### Pour Créer un Super-Administrateur

```sql
-- Remplacez 'email@exemple.com' par l'email de l'utilisateur

UPDATE profiles
SET
  role = 'admin,proprietaire,locataire,agence,trust_agent',
  active_role = 'admin',
  user_type = 'admin_ansut',
  trust_verified = true,
  trust_verified_at = NOW(),
  trust_score = 100,
  is_verified = true,
  ansut_certified = true,
  face_verified = true,
  face_verified_at = NOW(),
  oneci_verified = true,
  cnam_verified = true
WHERE email = 'email@exemple.com';
```

### Pour Ajouter comme Trust Agent

```sql
-- Après avoir créé l'admin, ajoutez-le comme Trust Agent

INSERT INTO trust_agents (
  user_id,
  full_name,
  email,
  phone,
  specialties,
  languages,
  status,
  working_hours,
  timezone,
  can_validate,
  can_mediate,
  can_moderate,
  can_manage_agents,
  salary_type,
  commission_rate,
  hired_at,
  last_active_at
)
SELECT
  id,
  full_name,
  email,
  phone,
  ARRAY['verification', 'mediation', 'fraud_detection', 'validation', 'inspection', 'legal'],
  ARRAY['fr', 'en'],
  'active',
  '{"monday": ["00:00-23:59"], "tuesday": ["00:00-23:59"], "wednesday": ["00:00-23:59"], "thursday": ["00:00-23:59"], "friday": ["00:00-23:59"], "saturday": ["00:00-23:59"], "sunday": ["00:00-23:59"]}'::jsonb,
  'Africa/Abidjan',
  true,
  true,
  true,
  true,
  'commission',
  5.0,
  NOW(),
  NOW()
FROM profiles
WHERE email = 'email@exemple.com'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  can_validate = true,
  can_mediate = true,
  can_moderate = true,
  can_manage_agents = true;
```

### Vérifier les Modifications

```sql
-- Vérifier le profil
SELECT
  id,
  email,
  full_name,
  role,
  active_role,
  user_type,
  trust_verified,
  is_verified,
  trust_score
FROM profiles
WHERE email = 'email@exemple.com';

-- Vérifier Trust Agent
SELECT
  user_id,
  email,
  status,
  specialties,
  can_validate,
  can_mediate,
  can_moderate,
  can_manage_agents
FROM trust_agents
WHERE email = 'email@exemple.com';
```

---

## 🎯 Rôles Disponibles

### Rôles Standards

| Rôle | Valeur | Description |
|------|--------|-------------|
| **Locataire** | `locataire` | Recherche et loue des propriétés |
| **Propriétaire** | `proprietaire` | Gère et loue ses propriétés |
| **Agence** | `agence` | Gère équipe et propriétés multiples |
| **Admin** | `admin` | Accès complet administration |
| **Trust Agent** | `trust_agent` | Validation et médiation |

### Types d'Utilisateur

| Type | Valeur | Description |
|------|--------|-------------|
| **Locataire** | `locataire` | Type par défaut |
| **Propriétaire** | `proprietaire` | Possède des biens |
| **Agence** | `agence` | Agence immobilière |
| **Admin ANSUT** | `admin_ansut` | Super-admin |

---

## 🔐 Permissions par Rôle

### Administrateur (`admin`)
✅ Gestion utilisateurs
✅ Configuration système
✅ Monitoring services
✅ Gestion API Keys
✅ Accès tous dashboards
✅ Génération données test
✅ Gestion CEV/ONECI

### Trust Agent (`trust_agent`)
✅ Validation documents
✅ Médiation litiges
✅ Modération contenus
✅ Vérification identité
✅ Gestion disputes

### Propriétaire (`proprietaire`)
✅ Ajouter propriétés
✅ Gérer visites
✅ Créer contrats
✅ Suivre paiements
✅ Demandes maintenance

### Locataire (`locataire`)
✅ Rechercher propriétés
✅ Planifier visites
✅ Postuler logements
✅ Voir score locataire
✅ Créer demandes maintenance

### Agence (`agence`)
✅ Gérer équipe
✅ Gérer propriétés multiples
✅ Suivre commissions
✅ Dashboard agence

---

## 📝 Exemples d'Utilisation

### Créer un Admin Simple

**Via Interface:**
1. Email: admin@montoit.ci
2. Type: Admin ANSUT
3. Cochez: Administrateur Principal
4. Sauvegarder

**Via SQL:**
```sql
UPDATE profiles
SET
  role = 'admin',
  active_role = 'admin',
  user_type = 'admin_ansut'
WHERE email = 'admin@montoit.ci';
```

### Créer un Propriétaire/Locataire

**Via Interface:**
1. Email: user@exemple.com
2. Type: Propriétaire
3. Rôles: Propriétaire + Locataire
4. Sauvegarder

**Via SQL:**
```sql
UPDATE profiles
SET
  role = 'proprietaire,locataire',
  active_role = 'proprietaire',
  user_type = 'proprietaire'
WHERE email = 'user@exemple.com';
```

### Créer un Trust Agent

**Via Interface:**
1. Email: agent@montoit.ci
2. Type: Locataire (ou autre)
3. Cochez: Trust Agent
4. Sauvegarder

**Via SQL:**
```sql
-- Mettre à jour le profil
UPDATE profiles
SET
  role = 'trust_agent',
  trust_verified = true,
  trust_score = 100
WHERE email = 'agent@montoit.ci';

-- Ajouter dans trust_agents
INSERT INTO trust_agents (user_id, full_name, email, status, can_validate, can_mediate, can_moderate)
SELECT id, full_name, email, 'active', true, true, true
FROM profiles WHERE email = 'agent@montoit.ci';
```

---

## 🔄 Multi-Rôles

Un utilisateur peut avoir **plusieurs rôles simultanément** :

### Exemple: Propriétaire + Agence
```sql
UPDATE profiles
SET
  role = 'proprietaire,agence',
  active_role = 'proprietaire',
  user_type = 'proprietaire'
WHERE email = 'user@exemple.com';
```

L'utilisateur pourra basculer entre les rôles via le **sélecteur de rôles** en haut du header.

---

## ⚠️ Important

### Après Attribution des Rôles

1. **L'utilisateur doit se déconnecter/reconnecter** pour que les changements prennent effet
2. Le **sélecteur de rôles** apparaît automatiquement si plusieurs rôles
3. Les **menus** s'adaptent selon le rôle actif

### Sécurité

- ⚠️ Ne donnez le rôle `admin` qu'aux personnes de confiance
- ⚠️ Le rôle `trust_agent` donne accès aux données sensibles
- ✅ Tous les changements sont auditables dans les logs

### Base de Données

- La colonne `role` contient tous les rôles (séparés par virgules)
- La colonne `active_role` indique le rôle actuellement actif
- La colonne `user_type` définit le type principal

---

## 🆘 Dépannage

### Les menus admin n'apparaissent pas ?

1. Vérifiez que `role` contient bien 'admin'
2. Vérifiez que `user_type` = 'admin_ansut'
3. Déconnectez-vous et reconnectez-vous
4. Videz le cache du navigateur (Ctrl+Shift+R)

### Le sélecteur de rôles est absent ?

- Il n'apparaît que si l'utilisateur a plusieurs rôles
- Vérifiez que `role` contient plusieurs valeurs séparées par virgules

### Erreur "Accès refusé" ?

- Vérifiez les permissions RLS (Row Level Security)
- Assurez-vous que le rôle est bien enregistré
- Rechargez la page

---

## 📊 Vérification Rapide

### Commande SQL pour Voir Tous les Admins

```sql
SELECT
  email,
  full_name,
  role,
  user_type,
  trust_verified,
  created_at
FROM profiles
WHERE role LIKE '%admin%'
   OR user_type = 'admin_ansut'
ORDER BY created_at DESC;
```

### Commande SQL pour Voir Tous les Trust Agents

```sql
SELECT
  p.email,
  p.full_name,
  ta.status,
  ta.can_validate,
  ta.can_mediate,
  ta.can_moderate
FROM profiles p
JOIN trust_agents ta ON ta.user_id = p.id
WHERE ta.status = 'active';
```

---

## ✅ Checklist Création Admin

- [ ] Email utilisateur vérifié
- [ ] Profil complet (nom, téléphone)
- [ ] Rôle `admin` attribué
- [ ] Type `admin_ansut` défini
- [ ] Trust Agent configuré (si nécessaire)
- [ ] Permissions vérifiées
- [ ] Utilisateur informé
- [ ] Test de connexion effectué

---

## 🎓 Ressources

- Interface graphique : `/admin/gestion-roles`
- Guide administrateur : `GUIDE_ADMINISTRATEUR.md`
- Documentation complète : `/docs`

---

**Voilà ! Vous savez maintenant comment créer des administrateurs et attribuer des rôles. 🚀**
