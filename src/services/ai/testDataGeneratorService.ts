import { supabase } from '../../lib/supabase';
import { AzureAIService } from './azureAIService';
import { getPropertyImages, getNeighborhoodImage } from '../../constants/ivoirianImages';

interface IvoirianName {
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  ethnic_group: string;
  meaning?: string;
}

interface TestProfile {
  personal_info: {
    first_name: string;
    last_name: string;
    full_name: string;
    age: number;
    gender: 'male' | 'female';
    ethnic_group: string;
    phone: string;
    email: string;
  };
  professional_info: {
    occupation: string;
    employer: string;
    monthly_income: number;
    employment_duration_years: number;
  };
  family_info: {
    marital_status: string;
    children_count: number;
  };
  housing_preferences: {
    preferred_neighborhoods: string[];
    property_type: string;
    budget_min: number;
    budget_max: number;
  };
  rental_history: Array<{
    address: string;
    neighborhood: string;
    duration_months: number;
    monthly_rent: number;
  }>;
}

interface TestProperty {
  title: string;
  description: string;
  property_type: string;
  neighborhood: string;
  address: string;
  monthly_rent: number;
  surface_area: number;
  rooms: number;
  amenities: string[];
  nearby_places: string[];
  photos_description: string[];
  photos_urls?: string[];
  main_image_url?: string;
  neighborhood_image_url?: string;
}

interface TestDocument {
  document_type: string;
  document_number: string;
  personal_info: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    place_of_birth: string;
    gender: string;
  };
  issue_date: string;
  expiry_date: string;
  watermark: {
    text: string;
    style: {
      opacity: number;
      color: string;
      rotation: number;
    };
  };
}

interface ConversationMessage {
  sender_role: 'tenant' | 'landlord';
  sender_name: string;
  message: string;
  timestamp: string;
}

interface PaymentRecord {
  date: string;
  amount: number;
  method: string;
  reference: string;
  status: 'paid' | 'late' | 'early';
  days_difference: number;
}

export class TestDataGeneratorService {
  static async getRandomIvoirianName(
    gender: 'male' | 'female' | null = null
  ): Promise<IvoirianName> {
    const { data, error } = await supabase.rpc('get_random_ivorian_name', {
      p_gender: gender,
    });

    if (error) throw error;
    return data as IvoirianName;
  }

  static async generateTestProfile(
    userId: string,
    gender: 'male' | 'female' | null = null
  ): Promise<TestProfile> {
    const name = await this.getRandomIvoirianName(gender);

    const { data: template } = await supabase
      .from('test_data_templates')
      .select('*')
      .eq('template_type', 'profile')
      .eq('active', true)
      .maybeSingle();

    if (!template) {
      throw new Error('Template de profil non trouvé');
    }

    const rules = template.generation_rules as any;

    const age =
      Math.floor(
        Math.random() * (rules.age_range.max - rules.age_range.min + 1)
      ) + rules.age_range.min;

    const income =
      Math.floor(
        Math.random() * (rules.income_range.max - rules.income_range.min + 1)
      ) + rules.income_range.min;

    const aiPrompt = `${template.ai_prompt}

Utilise ces informations de base:
- Nom: ${name.first_name} ${name.last_name}
- Genre: ${name.gender === 'male' ? 'Homme' : 'Femme'}
- Groupe ethnique: ${name.ethnic_group}
- Âge: ${age} ans
- Revenu mensuel: ${income} FCFA

Génère un profil complet et cohérent en JSON.`;

    const response = await AzureAIService.callAzureOpenAI(
      [
        {
          role: 'system',
          content:
            'Tu es un expert en génération de données de test réalistes pour la Côte d\'Ivoire. Tu génères des données 100% cohérentes et contextualisées. Réponds UNIQUEMENT en JSON valide, sans texte additionnel.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      userId,
      'generate_test_profile',
      { temperature: 0.9, maxTokens: 1500 }
    );

    const aiData = JSON.parse(response);
    const phoneNumber = `+225 ${Math.floor(Math.random() * 90000000) + 10000000}`;
    const email = `${name.first_name.toLowerCase()}.${name.last_name.toLowerCase()}@test.montoit.ci`;

    const profile: TestProfile = {
      personal_info: {
        first_name: name.first_name,
        last_name: name.last_name,
        full_name: `${name.first_name} ${name.last_name}`,
        age,
        gender: name.gender,
        ethnic_group: name.ethnic_group,
        phone: phoneNumber,
        email,
      },
      professional_info: aiData.professional_info || {
        occupation: rules.professions[Math.floor(Math.random() * rules.professions.length)],
        employer: 'Entreprise Test CI',
        monthly_income: income,
        employment_duration_years: Math.floor(Math.random() * 10) + 1,
      },
      family_info: aiData.family_info || {
        marital_status: 'Marié(e)',
        children_count: Math.floor(Math.random() * 4),
      },
      housing_preferences: aiData.housing_preferences || {
        preferred_neighborhoods: rules.quartiers.slice(0, 3),
        property_type: 'F3',
        budget_min: income * 0.25,
        budget_max: income * 0.35,
      },
      rental_history: aiData.rental_history || [],
    };

    await supabase.rpc('save_generated_test_data', {
      p_template_id: template.id,
      p_data_type: 'profile',
      p_generated_data: profile as any,
      p_ai_tokens_used: AzureAIService.calculateTokenEstimate(response),
      p_generated_by: userId,
    });

    return profile;
  }

  static async generateTestProperty(userId: string): Promise<TestProperty> {
    const { data: template } = await supabase
      .from('test_data_templates')
      .select('*')
      .eq('template_type', 'property')
      .eq('active', true)
      .maybeSingle();

    if (!template) {
      throw new Error('Template de propriété non trouvé');
    }

    const rules = template.generation_rules as any;
    const propertyType =
      rules.property_types[
        Math.floor(Math.random() * rules.property_types.length)
      ];
    const quartier =
      rules.quartiers[Math.floor(Math.random() * rules.quartiers.length)];
    const priceRange = rules.price_ranges[propertyType];
    const monthlyRent =
      Math.floor(
        Math.random() * (priceRange.max - priceRange.min + 1)
      ) + priceRange.min;

    const aiPrompt = `${template.ai_prompt}

Génère pour:
- Type: ${propertyType}
- Quartier: ${quartier}, Abidjan
- Loyer: ${monthlyRent} FCFA/mois

Inclus des détails réalistes pour Abidjan avec vocabulaire ivoirien.`;

    const response = await AzureAIService.callAzureOpenAI(
      [
        {
          role: 'system',
          content:
            'Tu es un expert immobilier ivoirien. Génère des annonces immobilières réalistes pour Abidjan en français local. Réponds UNIQUEMENT en JSON valide.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      userId,
      'generate_test_property',
      { temperature: 0.8, maxTokens: 1200 }
    );

    const property: TestProperty = JSON.parse(response);

    // Ajouter les URLs d'images ivoiriennes réelles
    property.photos_urls = getPropertyImages(quartier, propertyType, 5);
    property.main_image_url = property.photos_urls[0];
    property.neighborhood_image_url = getNeighborhoodImage(quartier);

    await supabase.rpc('save_generated_test_data', {
      p_template_id: template.id,
      p_data_type: 'property',
      p_generated_data: property as any,
      p_ai_tokens_used: AzureAIService.calculateTokenEstimate(response),
      p_generated_by: userId,
    });

    return property;
  }

  static async generateTestDocument(
    userId: string,
    documentType: 'CNI' | 'passport' | 'attestation' = 'CNI',
    name?: IvoirianName
  ): Promise<TestDocument> {
    const personName = name || (await this.getRandomIvoirianName());

    const { data: template } = await supabase
      .from('test_data_templates')
      .select('*')
      .eq('template_type', 'document')
      .eq('active', true)
      .maybeSingle();

    if (!template) {
      throw new Error('Template de document non trouvé');
    }

    const rules = template.generation_rules as any;
    const commune =
      rules.communes[Math.floor(Math.random() * rules.communes.length)];

    const birthYear = 2024 - (Math.floor(Math.random() * 40) + 20);
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const dateOfBirth = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

    const issueDate = new Date();
    issueDate.setFullYear(issueDate.getFullYear() - Math.floor(Math.random() * 3));
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 10);

    const documentNumber = `CI${Math.floor(Math.random() * 9000000000) + 1000000000}`;

    const document: TestDocument = {
      document_type: documentType,
      document_number: documentNumber,
      personal_info: {
        first_name: personName.first_name,
        last_name: personName.last_name,
        date_of_birth: dateOfBirth,
        place_of_birth: commune,
        gender: personName.gender === 'male' ? 'M' : 'F',
      },
      issue_date: issueDate.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      watermark: {
        text: 'COPIE NON CONFORME - DOCUMENT DE TEST',
        style: rules.watermark_style,
      },
    };

    await supabase.rpc('save_generated_test_data', {
      p_template_id: template.id,
      p_data_type: 'document',
      p_generated_data: document as any,
      p_ai_tokens_used: 50,
      p_generated_by: userId,
    });

    return document;
  }

  static async generateTestConversation(
    userId: string,
    tenantName?: IvoirianName,
    landlordName?: IvoirianName
  ): Promise<ConversationMessage[]> {
    const tenant = tenantName || (await this.getRandomIvoirianName());
    const landlord = landlordName || (await this.getRandomIvoirianName());

    const { data: template } = await supabase
      .from('test_data_templates')
      .select('*')
      .eq('template_type', 'conversation')
      .eq('active', true)
      .maybeSingle();

    if (!template) {
      throw new Error('Template de conversation non trouvé');
    }

    const aiPrompt = `${template.ai_prompt}

Locataire: ${tenant.first_name} ${tenant.last_name}
Propriétaire: ${landlord.first_name} ${landlord.last_name}

Génère une conversation naturelle avec expressions ivoiriennes.`;

    const response = await AzureAIService.callAzureOpenAI(
      [
        {
          role: 'system',
          content:
            'Tu es un expert en conversations ivoiriennes. Génère des dialogues naturels entre locataires et propriétaires en Côte d\'Ivoire. Utilise des expressions locales courantes. Réponds en JSON avec un array de messages.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      userId,
      'generate_test_conversation',
      { temperature: 0.9, maxTokens: 1000 }
    );

    const messages: ConversationMessage[] = JSON.parse(response);

    await supabase.rpc('save_generated_test_data', {
      p_template_id: template.id,
      p_data_type: 'conversation',
      p_generated_data: { messages } as any,
      p_ai_tokens_used: AzureAIService.calculateTokenEstimate(response),
      p_generated_by: userId,
    });

    return messages;
  }

  static async generateTestPaymentHistory(
    userId: string,
    monthlyRent: number,
    months: number = 12
  ): Promise<PaymentRecord[]> {
    const { data: template } = await supabase
      .from('test_data_templates')
      .select('*')
      .eq('template_type', 'payment')
      .eq('active', true)
      .maybeSingle();

    if (!template) {
      throw new Error('Template de paiement non trouvé');
    }

    const rules = template.generation_rules as any;
    const payments: PaymentRecord[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    for (let i = 0; i < months; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      const rand = Math.random() * 100;
      let status: 'paid' | 'late' | 'early';
      let daysDiff = 0;

      if (rand < rules.payment_status_distribution.on_time) {
        status = 'paid';
        daysDiff = Math.floor(Math.random() * 3);
      } else if (
        rand <
        rules.payment_status_distribution.on_time +
          rules.payment_status_distribution.late
      ) {
        status = 'late';
        daysDiff = Math.floor(Math.random() * 15) + 1;
      } else {
        status = 'early';
        daysDiff = -(Math.floor(Math.random() * 5) + 1);
      }

      paymentDate.setDate(paymentDate.getDate() + daysDiff);

      const method =
        rules.payment_methods[
          Math.floor(Math.random() * rules.payment_methods.length)
        ];
      const reference = `${method.replace(/\s/g, '').toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      payments.push({
        date: paymentDate.toISOString().split('T')[0],
        amount: monthlyRent,
        method,
        reference,
        status,
        days_difference: daysDiff,
      });
    }

    await supabase.rpc('save_generated_test_data', {
      p_template_id: template.id,
      p_data_type: 'payment',
      p_generated_data: { payments } as any,
      p_ai_tokens_used: 100,
      p_generated_by: userId,
    });

    return payments;
  }

  static async generateCompleteTestScenario(userId: string): Promise<{
    tenant: TestProfile;
    landlord: TestProfile;
    property: TestProperty;
    tenantDocument: TestDocument;
    landlordDocument: TestDocument;
    conversation: ConversationMessage[];
    paymentHistory: PaymentRecord[];
  }> {
    const tenantProfile = await this.generateTestProfile(userId, null);
    const landlordProfile = await this.generateTestProfile(userId, null);
    const property = await this.generateTestProperty(userId);

    const tenantName: IvoirianName = {
      first_name: tenantProfile.personal_info.first_name,
      last_name: tenantProfile.personal_info.last_name,
      gender: tenantProfile.personal_info.gender,
      ethnic_group: tenantProfile.personal_info.ethnic_group,
    };

    const landlordName: IvoirianName = {
      first_name: landlordProfile.personal_info.first_name,
      last_name: landlordProfile.personal_info.last_name,
      gender: landlordProfile.personal_info.gender,
      ethnic_group: landlordProfile.personal_info.ethnic_group,
    };

    const tenantDocument = await this.generateTestDocument(
      userId,
      'CNI',
      tenantName
    );
    const landlordDocument = await this.generateTestDocument(
      userId,
      'CNI',
      landlordName
    );
    const conversation = await this.generateTestConversation(
      userId,
      tenantName,
      landlordName
    );
    const paymentHistory = await this.generateTestPaymentHistory(
      userId,
      property.monthly_rent,
      12
    );

    return {
      tenant: tenantProfile,
      landlord: landlordProfile,
      property,
      tenantDocument,
      landlordDocument,
      conversation,
      paymentHistory,
    };
  }

  static async getGenerationStats(): Promise<any> {
    const { data, error } = await supabase.rpc('get_test_data_stats');
    if (error) throw error;
    return data;
  }
}

export const testDataGeneratorService = TestDataGeneratorService;
