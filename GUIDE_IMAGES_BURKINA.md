# 📸 Guide: Remplacer par de vraies images du Burkina Faso

## 🎯 Objectif
Actuellement, MZAKA utilise des images génériques. Ce guide vous aide à les remplacer par de **vraies photos du Burkina Faso**.

## 📍 Images à Prendre

### Hero Slider (3 images prioritaires)

#### Image 1: Villa Moderne Ouagadougou
- **Lieu**: Ouaga 2000, Zone 1, ou 2Plateaux
- **Sujet**: Villa ou résidence moderne burkinabé
- **Style**: Architecture contemporaine locale
- **Format**: 1920x1080px minimum
- **Moment**: Journée ensoleillée, bonne lumière

#### Image 2: Immeuble Résidentiel
- **Lieu**: Centre-ville Ouagadougou ou Bobo-Dioulasso
- **Sujet**: Immeuble d'appartements moderne
- **Style**: Construction récente, bien entretenue
- **Format**: 1920x1080px minimum
- **Moment**: Golden hour (lever/coucher de soleil)

#### Image 3: Quartier Résidentiel
- **Lieu**: Quartier populaire mais propre (Gounghin, Cissin)
- **Sujet**: Vue d'ensemble d'un quartier
- **Style**: Vie locale, authenticité
- **Format**: 1920x1080px minimum
- **Moment**: Après-midi, vie de quartier

## 🗂️ Où Héberger les Images

### Option 1: Supabase Storage (Recommandé)
```bash
# 1. Créer le bucket dans Supabase Dashboard
# 2. Upload vos images
# 3. Obtenir les URLs publiques
# 4. Copier dans burkinabeImages.ts
```

### Option 2: Dossier Public
```bash
# 1. Placer les images dans /public/images/hero/
public/images/hero/ouaga-villa.jpg
public/images/hero/immeuble-moderne.jpg
public/images/hero/quartier-residentiel.jpg

# 2. Dans burkinabeImages.ts, utiliser:
image: '/images/hero/ouaga-villa.jpg'
```

### Option 3: CDN Externe
- Cloudinary
- ImageKit
- AWS S3

## ⚙️ Comment Remplacer

### Étape 1: Ouvrir le fichier
```bash
src/constants/burkinabeImages.ts
```

### Étape 2: Remplacer les URLs
```typescript
// AVANT (image générique)
image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',

// APRÈS (votre vraie photo)
image: 'https://votre-url-supabase.com/storage/v1/object/public/images/hero/ouaga-villa.jpg',
// OU
image: '/images/hero/ouaga-villa.jpg',
```

### Étape 3: Tester
```bash
npm run dev
# Vérifier que les images s'affichent correctement
```

## 📋 Checklist Images

### Hero (priorité haute)
- [ ] Image 1: Villa moderne Ouagadougou
- [ ] Image 2: Immeuble résidentiel
- [ ] Image 3: Quartier résidentiel

### Quartiers (priorité moyenne)
- [ ] Zone 1
- [ ] 2Plateaux
- [ ] Ouaga 2000
- [ ] Gounghin
- [ ] Cissin

### Villes (priorité basse)
- [ ] Ouagadougou skyline
- [ ] Bobo-Dioulasso
- [ ] Koudougou
- [ ] Ouahigouya
- [ ] Banfora

## 📐 Spécifications Techniques

### Format
- **Résolution**: 1920x1080px (Full HD) minimum
- **Ratio**: 16:9 pour le hero
- **Format**: JPG (optimisé, <500KB par image)
- **Qualité**: 80-85% en compression JPG

### Optimisation
```bash
# Utiliser ImageOptim, TinyPNG, ou Squoosh
# Objectif: <500KB par image hero
```

## 🎨 Conseils Photo

### Composition
- ✅ Lumière naturelle, éviter contre-jour
- ✅ Bâtiments nets, bien cadrés
- ✅ Ciel visible (20-30% de l'image)
- ✅ Couleurs vibrantes mais naturelles

### À Éviter
- ❌ Photos floues ou pixelisées
- ❌ Personnes identifiables (RGPD)
- ❌ Marques/logos visibles
- ❌ Chantiers en cours

## 🚀 Déploiement

Une fois les images remplacées:
```bash
npm run build
# Vérifier le build
# Déployer sur votre serveur
```

## 📞 Besoin d'Aide?

Si vous n'avez pas de photographe:
1. **Photographe local**: Engager un photographe à Ouaga
2. **Community**: Demander aux utilisateurs de partager leurs photos
3. **Drone**: Photos aériennes de quartiers (permis requis)

## 🔗 Ressources

- Supabase Storage: https://supabase.com/docs/guides/storage
- Optimisation images: https://tinypng.com
- Vérifier qualité: https://squoosh.app

---

**Une fois vos vraies photos uploadées, MZAKA sera 100% authentique Burkina Faso!** 🇧🇫✨
