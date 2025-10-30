import { azureAIService } from './azureAIService';

interface PropertyData {
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  surface_area: number | null;
  city: string;
  neighborhood: string | null;
  monthly_rent: number;
  has_parking: boolean;
  has_garden: boolean;
  is_furnished: boolean;
  has_ac: boolean;
  amenities?: string[];
}

export class DescriptionGeneratorService {
  static async generatePropertyDescription(
    propertyData: PropertyData,
    userId: string | null = null,
    style: 'professional' | 'casual' | 'luxury' = 'professional'
  ): Promise<string> {
    try {
      const prompt = this.buildDescriptionPrompt(propertyData, style);

      const messages = [
        {
          role: 'system',
          content: `Tu es un expert en rédaction d'annonces immobilières en Côte d'Ivoire.
Tu crées des descriptions captivantes, précises et optimisées pour attirer les locataires.
Utilise un ton ${style === 'professional' ? 'professionnel et élégant' : style === 'luxury' ? 'luxueux et exclusif' : 'convivial et accessible'}.
Écris toujours en français et mets en valeur les points forts.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const description = await azureAIService.callAzureOpenAI(
        messages,
        userId,
        'generate_description',
        {
          temperature: 0.9,
          maxTokens: 600,
          useCache: false,
        }
      );

      return description;
    } catch (error) {
      console.error('Error generating description:', error);
      return this.getFallbackDescription(propertyData);
    }
  }

  private static buildDescriptionPrompt(
    data: PropertyData,
    style: string
  ): string {
    const amenitiesList = this.buildAmenitiesList(data);

    return `Génère une description attractive et complète pour cette propriété immobilière à louer en Côte d'Ivoire:

Type de bien: ${this.translatePropertyType(data.property_type)}
Localisation: ${data.neighborhood ? data.neighborhood + ', ' : ''}${data.city}
Chambres: ${data.bedrooms}
Salles de bain: ${data.bathrooms}
${data.surface_area ? `Surface: ${data.surface_area} m²` : ''}
Loyer mensuel: ${data.monthly_rent.toLocaleString('fr-FR')} FCFA

Équipements et commodités:
${amenitiesList}

Instructions:
1. Commence par une accroche captivante qui met en valeur le principal atout
2. Décris l'espace de vie et l'agencement
3. Détaille les équipements et commodités
4. Mentionne l'emplacement et les avantages du quartier
5. Termine par une phrase engageante qui incite à visiter
6. Garde un ton ${style} et optimise pour le SEO
7. Limite la description à 150-200 mots maximum
8. N'invente pas d'informations non fournies

Génère uniquement la description, sans titre ni préambule.`;
  }

  private static buildAmenitiesList(data: PropertyData): string {
    const amenities: string[] = [];

    if (data.is_furnished) amenities.push('Meublé');
    if (data.has_ac) amenities.push('Climatisation');
    if (data.has_parking) amenities.push('Parking');
    if (data.has_garden) amenities.push('Jardin');

    if (data.amenities && data.amenities.length > 0) {
      amenities.push(...data.amenities);
    }

    return amenities.length > 0 ? amenities.map((a) => `- ${a}`).join('\n') : '- Aucun équipement spécifié';
  }

  private static translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
      appartement: 'Appartement',
      villa: 'Villa',
      studio: 'Studio',
      chambre: 'Chambre',
      bureau: 'Bureau',
      commerce: 'Local commercial',
    };
    return translations[type] || type;
  }

  private static getFallbackDescription(data: PropertyData): string {
    const type = this.translatePropertyType(data.property_type);
    const location = data.neighborhood
      ? `${data.neighborhood}, ${data.city}`
      : data.city;

    const amenitiesList = this.buildAmenitiesList(data);
    const amenitiesText = amenitiesList
      .split('\n')
      .filter((a) => !a.includes('Aucun'))
      .join(', ')
      .replace(/- /g, '');

    return `${type} de ${data.bedrooms} ${data.bedrooms > 1 ? 'chambres' : 'chambre'} à louer à ${location}.

Cette propriété ${data.is_furnished ? 'meublée' : ''} dispose de ${data.bathrooms} ${data.bathrooms > 1 ? 'salles de bain' : 'salle de bain'}${data.surface_area ? ` et offre une surface de ${data.surface_area} m²` : ''}.

${amenitiesText ? `Équipements inclus: ${amenitiesText}.` : ''}

Situé dans un quartier ${data.city === 'Abidjan' ? 'dynamique' : 'agréable'}, ce bien offre un excellent rapport qualité-prix pour un loyer de ${data.monthly_rent.toLocaleString('fr-FR')} FCFA par mois.

Contactez-nous dès maintenant pour organiser une visite !`;
  }

  static async improveDescription(
    currentDescription: string,
    userId: string | null = null
  ): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: `Tu es un expert en optimisation de descriptions immobilières.
Améliore les descriptions pour les rendre plus attractives, professionnelles et optimisées SEO.`,
        },
        {
          role: 'user',
          content: `Améliore cette description immobilière tout en gardant les mêmes informations factuelles:

${currentDescription}

Instructions:
- Rends-la plus engageante et attractive
- Optimise pour le SEO (mots-clés naturels)
- Améliore la structure et la fluidité
- Garde la même longueur approximative
- Conserve toutes les informations importantes`,
        },
      ];

      const improvedDescription = await azureAIService.callAzureOpenAI(
        messages,
        userId,
        'improve_description',
        {
          temperature: 0.8,
          maxTokens: 600,
          useCache: false,
        }
      );

      return improvedDescription;
    } catch (error) {
      console.error('Error improving description:', error);
      return currentDescription;
    }
  }

  static async extractKeyFeatures(
    description: string,
    userId: string | null = null
  ): Promise<string[]> {
    try {
      const keyPhrases = await azureAIService.extractKeyPhrases(
        description,
        userId
      );
      return keyPhrases.slice(0, 10);
    } catch (error) {
      console.error('Error extracting key features:', error);
      return [];
    }
  }

  static async translateDescription(
    description: string,
    targetLanguage: 'en' | 'fr' = 'en',
    userId: string | null = null
  ): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: `Tu es un traducteur expert spécialisé en immobilier.
Traduis les descriptions de propriétés de manière naturelle et professionnelle.`,
        },
        {
          role: 'user',
          content: `Traduis cette description immobilière en ${targetLanguage === 'en' ? 'anglais' : 'français'}:

${description}

Garde le même ton et la même structure.`,
        },
      ];

      const translation = await azureAIService.callAzureOpenAI(
        messages,
        userId,
        'translate_description',
        {
          temperature: 0.3,
          maxTokens: 600,
          useCache: true,
        }
      );

      return translation;
    } catch (error) {
      console.error('Error translating description:', error);
      return description;
    }
  }

  static async analyzeSentiment(
    description: string,
    userId: string | null = null
  ): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
  }> {
    try {
      const result = await azureAIService.analyzeText(
        description,
        'sentiment',
        userId
      );

      const sentiment = result.sentiment || 'neutral';
      const scores = result.confidenceScores || {
        positive: 0.5,
        neutral: 0.5,
        negative: 0,
      };

      return {
        sentiment,
        score:
          sentiment === 'positive'
            ? scores.positive
            : sentiment === 'negative'
              ? scores.negative
              : scores.neutral,
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { sentiment: 'neutral', score: 0.5 };
    }
  }
}

export const descriptionGeneratorService = DescriptionGeneratorService;
