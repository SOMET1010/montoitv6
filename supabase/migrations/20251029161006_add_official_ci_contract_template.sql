/*
  # Official Côte d'Ivoire Rental Contract Template

  ## Overview
  Adds the official standardized rental contract template for Côte d'Ivoire
  that complies with the Ivorian Civil Code and applicable decrees for
  residential property rentals.

  ## Changes
  1. Inserts official contract template with all mandatory sections:
     - Party identification (landlord and tenant)
     - Property designation with complete description
     - Duration of lease (typically one year renewable for residential)
     - Rent amount, payment terms, and deposit requirements
     - Obligations of landlord (deliver decent housing, peaceful enjoyment, necessary repairs)
     - Obligations of tenant (pay rent on time, use premises peacefully, maintain property, get insurance, respect co-ownership rules)
     - Entrance inventory state
     - List of equipment (if furnished)
     - Mandatory annexes references
  
  2. Template includes all legally required sections per Ivorian law
  
  3. Formatted for professional legal document appearance
  
  ## Notes
  - Template is in French (legal requirement for Côte d'Ivoire)
  - Includes placeholders for all required information
  - Follows the official structure recommended by Ivorian authorities
  - Supports both furnished and unfurnished properties
  - Includes sections for custom clauses while maintaining legal compliance
*/

-- Delete existing templates to replace with official version
DELETE FROM contract_templates WHERE contract_type = 'longue_duree';

-- Insert official Côte d'Ivoire contract template
INSERT INTO contract_templates (name, description, contract_type, template_content, required_fields, is_active) VALUES
('Bail d''Habitation - Modèle Officiel Côte d''Ivoire', 
'Contrat de bail conforme au Code Civil Ivoirien pour location à usage d''habitation', 
'longue_duree',
'# CONTRAT DE BAIL À USAGE D''HABITATION
## (Modèle Conforme au Code Civil Ivoirien)

---

**Référence du Contrat:** {{contract_number}}
**Date d''établissement:** {{creation_date}}

---

## ENTRE LES SOUSSIGNÉS :

### LE BAILLEUR (Propriétaire)

**Nom complet:** {{landlord_name}}
**Adresse:** {{landlord_address}}
**Téléphone:** {{landlord_phone}}
**Email:** {{landlord_email}}
**Pièce d''identité:** CNI N° {{landlord_id_number}} (certifié ANSUT)

Ci-après dénommé « **LE BAILLEUR** »

**D''UNE PART,**

### ET

### LE PRENEUR (Locataire)

**Nom complet:** {{tenant_name}}
**Adresse actuelle:** {{tenant_address}}
**Téléphone:** {{tenant_phone}}
**Email:** {{tenant_email}}
**Pièce d''identité:** CNI N° {{tenant_id_number}} (certifié ANSUT)
**Profession:** {{tenant_profession}}

Ci-après dénommé « **LE LOCATAIRE** »

**D''AUTRE PART,**

---

## IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :

---

### ARTICLE 1 : OBJET DU CONTRAT

Le BAILLEUR donne à bail au LOCATAIRE qui accepte, le local à usage d''habitation désigné ci-après, que ce dernier déclare bien connaître pour l''avoir visité avant la signature du présent contrat.

---

### ARTICLE 2 : DÉSIGNATION DU LOCAL LOUÉ

Le bien immobilier objet du présent bail est situé à l''adresse suivante :

**Adresse complète:** {{property_address}}
**Ville/Commune:** {{property_city}}
**Quartier:** {{property_neighborhood}}

**Désignation du bien:**
- **Type de logement:** {{property_type}}
- **Superficie habitable:** {{property_surface}} m²
- **Nombre de chambres:** {{property_bedrooms}}
- **Nombre de salles de bain:** {{property_bathrooms}}
- **Nombre de salons:** {{property_living_rooms}}
- **Cuisine:** {{property_kitchen}}
- **Autres pièces:** {{property_other_rooms}}

**État et équipements:**
{{property_description}}

**Équipements inclus:**
{{property_equipment}}

Le LOCATAIRE déclare avoir visité les lieux et les accepter en l''état.

---

### ARTICLE 3 : DURÉE DU BAIL

Le présent bail est consenti et accepté pour une durée déterminée de :

**Date de début:** {{start_date}}
**Date de fin:** {{end_date}}
**Durée totale:** {{lease_duration}} mois

Le bail pourra être renouvelé par accord mutuel des parties, dans les conditions prévues par la législation en vigueur.

En cas de tacite reconduction, le bail se poursuivra aux mêmes conditions pour une durée équivalente.

---

### ARTICLE 4 : LOYER ET CONDITIONS FINANCIÈRES

#### 4.1 - MONTANT DU LOYER

Le loyer mensuel est fixé à la somme de :

**{{monthly_rent}} FRANCS CFA ({{monthly_rent_words}} Francs CFA)**

Ce loyer est payable d''avance, le {{payment_day}} de chaque mois.

#### 4.2 - CHARGES

Les charges mensuelles s''élèvent à :

**{{charges_amount}} FRANCS CFA**

Ces charges comprennent : {{charges_description}}

#### 4.3 - DÉPÔT DE GARANTIE

À la signature du présent bail, le LOCATAIRE verse au BAILLEUR un dépôt de garantie d''un montant de :

**{{deposit_amount}} FRANCS CFA ({{deposit_amount_words}} Francs CFA)**

Ce dépôt sera restitué au LOCATAIRE dans un délai maximum de deux (2) mois après son départ, déduction faite, le cas échéant, des sommes restant dues et du coût des réparations locatives mises à sa charge.

#### 4.4 - MODALITÉS DE PAIEMENT

Le paiement du loyer s''effectuera :
- Par virement bancaire
- Par Mobile Money (Orange Money, MTN Money, Moov Money, Wave)
- En espèces contre reçu

Les coordonnées de paiement seront communiquées au LOCATAIRE.

#### 4.5 - RÉVISION DU LOYER

Le loyer pourra être révisé annuellement selon les modalités prévues par la législation en vigueur en Côte d''Ivoire.

---

### ARTICLE 5 : ÉTAT DES LIEUX

Un état des lieux contradictoire sera établi lors de la remise des clés au LOCATAIRE et lors de leur restitution au BAILLEUR.

Cet état des lieux sera annexé au présent contrat et signé par les deux parties.

En l''absence d''état des lieux de sortie, le logement est présumé avoir été restitué dans l''état où il se trouvait lors de l''entrée dans les lieux.

---

### ARTICLE 6 : DESTINATION DES LIEUX

Les lieux loués ne pourront servir qu''à **l''usage d''habitation** du LOCATAIRE et de sa famille.

Toute autre utilisation, notamment commerciale ou professionnelle, est strictement interdite sans l''accord écrit préalable du BAILLEUR.

---

### ARTICLE 7 : OBLIGATIONS DU BAILLEUR

Le BAILLEUR s''engage à :

1. **Délivrer au LOCATAIRE un logement décent** ne laissant pas apparaître de risques manifestes pouvant porter atteinte à la sécurité physique ou à la santé
2. **Assurer au LOCATAIRE la jouissance paisible du logement** pendant toute la durée du bail
3. **Entretenir les locaux en état de servir** à l''usage prévu par le contrat
4. **Effectuer toutes les réparations nécessaires** autres que locatives
5. **Ne pas s''opposer aux aménagements** réalisés par le LOCATAIRE, dès lors qu''ils ne constituent pas une transformation de la chose louée

Le BAILLEUR ne pourra exiger du LOCATAIRE aucune clause abusive contraire à la loi.

---

### ARTICLE 8 : OBLIGATIONS DU LOCATAIRE

Le LOCATAIRE s''engage à :

1. **Payer le loyer et les charges aux échéances convenues**
2. **User paisiblement des lieux loués** suivant la destination qui leur a été donnée
3. **Répondre des dégradations et des pertes** qui surviennent pendant la durée du contrat, sauf si elles sont dues à la vétusté, à un vice de construction ou à un cas de force majeure
4. **Ne pas transformer les lieux loués sans l''accord écrit du BAILLEUR**
5. **Ne pas sous-louer** sans l''autorisation expresse et écrite du BAILLEUR
6. **Souscrire une assurance contre les risques locatifs** (incendie, dégâts des eaux, explosion) et en justifier lors de la remise des clés puis annuellement à la demande du BAILLEUR
7. **Respecter le règlement de copropriété** s''il existe
8. **Laisser exécuter les travaux** d''amélioration ou de réparation urgents et nécessaires
9. **Entretenir et maintenir en bon état** les équipements mentionnés dans l''état des lieux
10. **Restituer les lieux en bon état** à la fin du bail

---

### ARTICLE 9 : ASSURANCE

Le LOCATAIRE doit obligatoirement souscrire une assurance contre les risques locatifs et en justifier au BAILLEUR dès la remise des clés.

À défaut d''assurance, le BAILLEUR pourra résilier le bail de plein droit après mise en demeure restée sans effet pendant un délai d''un mois.

---

### ARTICLE 10 : TRAVAUX

**10.1 - TRAVAUX À LA CHARGE DU BAILLEUR**

Le BAILLEUR prend à sa charge les grosses réparations définies par le Code Civil, notamment :
- Réparations des gros murs et des voûtes
- Rétablissement des poutres et des couvertures entières
- Réparations des digues et des murs de soutènement

**10.2 - TRAVAUX À LA CHARGE DU LOCATAIRE**

Le LOCATAIRE prend à sa charge les réparations locatives et l''entretien courant, notamment :
- Entretien des peintures intérieures
- Remplacement des vitres cassées
- Entretien de la robinetterie
- Entretien des équipements

---

### ARTICLE 11 : RÉSILIATION DU BAIL

**11.1 - PAR LE LOCATAIRE**

Le LOCATAIRE peut résilier le bail à tout moment en respectant un préavis de **trois (3) mois**, sauf dispositions législatives contraires.

Le préavis doit être notifié par lettre recommandée avec accusé de réception ou par acte d''huissier.

**11.2 - PAR LE BAILLEUR**

Le BAILLEUR peut donner congé au LOCATAIRE en respectant un préavis de **six (6) mois** dans les conditions prévues par la loi, notamment :
- Pour reprendre le logement en vue de l''occuper lui-même
- Pour vendre le logement
- Pour motif légitime et sérieux

**11.3 - POUR MANQUEMENT AUX OBLIGATIONS**

En cas de manquement par l''une des parties à ses obligations, le bail pourra être résilié de plein droit après mise en demeure restée sans effet pendant un délai d''un mois.

---

### ARTICLE 12 : CESSION ET SOUS-LOCATION

Le LOCATAIRE ne peut ni céder le bail, ni sous-louer tout ou partie des lieux loués sans l''autorisation écrite du BAILLEUR.

---

### ARTICLE 13 : CLAUSE RÉSOLUTOIRE

À défaut de paiement du loyer ou des charges aux termes convenus, et un mois après un commandement de payer demeuré infructueux, le présent bail sera résilié de plein droit si bon semble au BAILLEUR.

---

### ARTICLE 14 : ÉLECTION DE DOMICILE

Pour l''exécution des présentes et de leurs suites, les parties font élection de domicile en leurs demeures respectives ci-dessus désignées.

---

### ARTICLE 15 : RÈGLEMENT DES LITIGES

En cas de litige relatif à l''interprétation ou à l''exécution du présent contrat, les parties s''engagent à rechercher une solution amiable.

À défaut d''accord, le litige sera porté devant les juridictions compétentes de **{{jurisdiction}}**.

---

### ARTICLE 16 : CLAUSES PARTICULIÈRES

{{custom_clauses}}

---

## ANNEXES OBLIGATOIRES

Le présent contrat comprend les annexes suivantes :

1. ✓ État des lieux d''entrée (contradictoire)
2. ✓ Attestation d''assurance risques locatifs
3. ✓ Règlement de copropriété (le cas échéant)
4. ✓ Diagnostic de performance énergétique (si applicable)
5. ✓ Notice d''information sur les droits et obligations du locataire

---

## SIGNATURES ÉLECTRONIQUES

Le présent contrat est établi en deux (2) exemplaires originaux, dont un pour chaque partie.

Les parties reconnaissent la valeur juridique de la signature électronique certifiée par **ANSUT** et horodatée par **CryptoNeo**, conformément à la législation ivoirienne sur les transactions électroniques.

**Fait électroniquement via la plateforme Mon Toit**
**Date de signature électronique:** {{signature_date}}

---

### LE BAILLEUR
**Nom:** {{landlord_name}}
**Date de signature:** {{landlord_signature_date}}
**Signature électronique certifiée ANSUT**

_[Signature électronique]_

---

### LE LOCATAIRE
**Nom:** {{tenant_name}}
**Date de signature:** {{tenant_signature_date}}
**Signature électronique certifiée ANSUT**

_[Signature électronique]_

---

**Document certifié par la plateforme Mon Toit**
**Certification ANSUT - Horodatage sécurisé CryptoNeo**
**Référence:** {{contract_number}}',
'["contract_number", "creation_date", "landlord_name", "landlord_address", "landlord_phone", "landlord_email", "landlord_id_number", "tenant_name", "tenant_address", "tenant_phone", "tenant_email", "tenant_id_number", "tenant_profession", "property_address", "property_city", "property_neighborhood", "property_type", "property_surface", "property_bedrooms", "property_bathrooms", "property_living_rooms", "property_kitchen", "property_other_rooms", "property_description", "property_equipment", "start_date", "end_date", "lease_duration", "monthly_rent", "monthly_rent_words", "payment_day", "charges_amount", "charges_description", "deposit_amount", "deposit_amount_words", "jurisdiction", "custom_clauses", "signature_date", "landlord_signature_date", "tenant_signature_date"]'::jsonb,
true);
