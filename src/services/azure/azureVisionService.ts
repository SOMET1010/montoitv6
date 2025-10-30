import { serviceProviderFactory, ServiceResponse } from '../providers/serviceProviderFactory';

export interface ImageAnalysisResult {
  description: string;
  tags: string[];
  objects: Array<{
    object: string;
    confidence: number;
    rectangle: { x: number; y: number; w: number; h: number };
  }>;
  categories: string[];
  color: {
    dominantColorForeground: string;
    dominantColorBackground: string;
    dominantColors: string[];
    accentColor: string;
  };
  imageType: {
    clipArtType: number;
    lineDrawingType: number;
  };
  adult: {
    isAdultContent: boolean;
    isRacyContent: boolean;
    isGoryContent: boolean;
    adultScore: number;
    racyScore: number;
    goreScore: number;
  };
}

export interface OCRResult {
  text: string;
  lines: Array<{
    text: string;
    boundingBox: number[];
    words: Array<{
      text: string;
      boundingBox: number[];
      confidence: number;
    }>;
  }>;
  language: string;
}

export interface PropertyImageAnalysis {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  qualityScore: number;
  suggestedTags: string[];
  roomType: string;
  description: string;
  issues: string[];
}

class AzureVisionService {
  async analyzeImage(imageUrl: string): Promise<ServiceResponse<ImageAnalysisResult>> {
    return serviceProviderFactory.callWithFallback(
      'computer_vision',
      'analyze_image',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const features = [
          'Categories',
          'Description',
          'Tags',
          'Objects',
          'Color',
          'ImageType',
          'Adult',
        ].join(',');

        const response = await fetch(
          `${endpoint}/vision/v3.2/analyze?visualFeatures=${features}&language=fr`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Vision error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'computer_vision',
          'analyze_image',
          1,
          500,
          1,
          { imageUrl }
        );

        return {
          description: result.description?.captions[0]?.text || '',
          tags: result.tags?.map((t: any) => t.name) || [],
          objects: result.objects?.map((o: any) => ({
            object: o.object,
            confidence: o.confidence,
            rectangle: o.rectangle,
          })) || [],
          categories: result.categories?.map((c: any) => c.name) || [],
          color: result.color || {},
          imageType: result.imageType || {},
          adult: result.adult || {},
        };
      }
    );
  }

  async analyzeImageFromBlob(imageBlob: Blob): Promise<ServiceResponse<ImageAnalysisResult>> {
    return serviceProviderFactory.callWithFallback(
      'computer_vision',
      'analyze_image',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const features = [
          'Categories',
          'Description',
          'Tags',
          'Objects',
          'Color',
          'ImageType',
          'Adult',
        ].join(',');

        const imageBuffer = await imageBlob.arrayBuffer();

        const response = await fetch(
          `${endpoint}/vision/v3.2/analyze?visualFeatures=${features}&language=fr`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/octet-stream',
            },
            body: imageBuffer,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Vision error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'computer_vision',
          'analyze_image',
          1,
          500,
          1
        );

        return {
          description: result.description?.captions[0]?.text || '',
          tags: result.tags?.map((t: any) => t.name) || [],
          objects: result.objects?.map((o: any) => ({
            object: o.object,
            confidence: o.confidence,
            rectangle: o.rectangle,
          })) || [],
          categories: result.categories?.map((c: any) => c.name) || [],
          color: result.color || {},
          imageType: result.imageType || {},
          adult: result.adult || {},
        };
      }
    );
  }

  async extractText(imageUrl: string): Promise<ServiceResponse<OCRResult>> {
    return serviceProviderFactory.callWithFallback(
      'computer_vision',
      'ocr',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const response = await fetch(
          `${endpoint}/vision/v3.2/read/analyze`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure OCR error: ${response.status} - ${errorText}`);
        }

        const operationLocation = response.headers.get('Operation-Location');
        if (!operationLocation) {
          throw new Error('No operation location returned');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const resultResponse = await fetch(operationLocation, {
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
          },
        });

        const result = await resultResponse.json();

        if (result.status === 'failed') {
          throw new Error('OCR operation failed');
        }

        const readResults = result.analyzeResult?.readResults || [];
        const lines = readResults.flatMap((page: any) => page.lines || []);

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'computer_vision',
          'ocr',
          1,
          500,
          1,
          { imageUrl, linesCount: lines.length }
        );

        return {
          text: lines.map((l: any) => l.text).join('\n'),
          lines: lines.map((l: any) => ({
            text: l.text,
            boundingBox: l.boundingBox,
            words: l.words || [],
          })),
          language: readResults[0]?.language || 'fr',
        };
      }
    );
  }

  async analyzePropertyImage(imageUrl: string): Promise<ServiceResponse<PropertyImageAnalysis>> {
    const analysis = await this.analyzeImage(imageUrl);

    if (!analysis.success || !analysis.data) {
      return {
        success: false,
        error: analysis.error || 'Analyse échouée',
      };
    }

    const data = analysis.data;

    const roomTypes = {
      kitchen: ['cuisine', 'kitchen', 'refrigerator', 'stove', 'oven'],
      bedroom: ['chambre', 'bedroom', 'bed', 'lit'],
      bathroom: ['salle de bain', 'bathroom', 'toilet', 'shower', 'bathtub'],
      living: ['salon', 'living', 'sofa', 'couch', 'television'],
      dining: ['salle à manger', 'dining', 'table', 'chair'],
      exterior: ['extérieur', 'exterior', 'building', 'house', 'facade'],
    };

    let roomType = 'unknown';
    let maxMatches = 0;

    for (const [type, keywords] of Object.entries(roomTypes)) {
      const matches = keywords.filter((keyword) =>
        [...data.tags, ...data.objects.map((o) => o.object), data.description]
          .join(' ')
          .toLowerCase()
          .includes(keyword.toLowerCase())
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        roomType = type;
      }
    }

    const qualityFactors = {
      hasGoodLighting: data.color.dominantColors.includes('White') ||
        data.color.dominantColorBackground === 'White',
      isNotBlurry: data.imageType.clipArtType === 0,
      hasNoAdultContent: !data.adult.isAdultContent,
      hasObjects: data.objects.length > 0,
      hasDescription: data.description.length > 10,
    };

    const qualityScore = Object.values(qualityFactors).filter(Boolean).length * 20;

    const quality: 'excellent' | 'good' | 'fair' | 'poor' =
      qualityScore >= 80
        ? 'excellent'
        : qualityScore >= 60
        ? 'good'
        : qualityScore >= 40
        ? 'fair'
        : 'poor';

    const issues: string[] = [];
    if (!qualityFactors.hasGoodLighting) issues.push('Éclairage insuffisant');
    if (!qualityFactors.isNotBlurry) issues.push('Image floue');
    if (!qualityFactors.hasNoAdultContent) issues.push('Contenu inapproprié détecté');
    if (!qualityFactors.hasObjects) issues.push('Aucun objet détecté');

    return {
      success: true,
      data: {
        quality,
        qualityScore,
        suggestedTags: data.tags.slice(0, 10),
        roomType,
        description: data.description,
        issues,
      },
    };
  }

  async moderateContent(imageUrl: string): Promise<ServiceResponse<{
    isAppropriate: boolean;
    hasAdultContent: boolean;
    hasRacyContent: boolean;
    hasGoreContent: boolean;
    scores: {
      adult: number;
      racy: number;
      gore: number;
    };
  }>> {
    const analysis = await this.analyzeImage(imageUrl);

    if (!analysis.success || !analysis.data) {
      return {
        success: false,
        error: analysis.error || 'Modération échouée',
      };
    }

    const adult = analysis.data.adult;

    return {
      success: true,
      data: {
        isAppropriate: !adult.isAdultContent && !adult.isGoryContent,
        hasAdultContent: adult.isAdultContent,
        hasRacyContent: adult.isRacyContent,
        hasGoreContent: adult.isGoryContent,
        scores: {
          adult: adult.adultScore,
          racy: adult.racyScore,
          gore: adult.goreScore,
        },
      },
    };
  }
}

export const azureVisionService = new AzureVisionService();
