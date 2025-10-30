import { serviceProviderFactory, ServiceResponse } from '../providers/serviceProviderFactory';

export interface FaceDetectionResult {
  faceId: string;
  faceRectangle: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  attributes?: {
    age?: number;
    gender?: string;
    emotion?: Record<string, number>;
    glasses?: string;
    facialHair?: Record<string, number>;
  };
}

export interface FaceVerificationResult {
  isIdentical: boolean;
  confidence: number;
  verified: boolean;
  message: string;
}

export interface LivenessDetectionResult {
  isLive: boolean;
  confidence: number;
  status: string;
}

class AzureFaceService {
  async detectFaces(
    imageUrl: string,
    returnAttributes: boolean = false
  ): Promise<ServiceResponse<FaceDetectionResult[]>> {
    return serviceProviderFactory.callWithFallback(
      'face_recognition',
      'detect_faces',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const attributesParam = returnAttributes
          ? '&returnFaceAttributes=age,gender,emotion,glasses,facialHair'
          : '';

        const response = await fetch(
          `${endpoint}/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false${attributesParam}`,
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
          throw new Error(`Azure Face API error: ${response.status} - ${errorText}`);
        }

        const faces = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'face_recognition',
          'detect_faces',
          faces.length,
          faces.length * 750,
          faces.length * 1.5,
          { imageUrl, faceCount: faces.length }
        );

        return faces.map((face: any) => ({
          faceId: face.faceId,
          faceRectangle: face.faceRectangle,
          attributes: face.faceAttributes,
        }));
      }
    );
  }

  async detectFacesFromBlob(
    imageBlob: Blob,
    returnAttributes: boolean = false
  ): Promise<ServiceResponse<FaceDetectionResult[]>> {
    return serviceProviderFactory.callWithFallback(
      'face_recognition',
      'detect_faces',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const attributesParam = returnAttributes
          ? '&returnFaceAttributes=age,gender,emotion,glasses,facialHair'
          : '';

        const imageBuffer = await imageBlob.arrayBuffer();

        const response = await fetch(
          `${endpoint}/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false${attributesParam}`,
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
          throw new Error(`Azure Face API error: ${response.status} - ${errorText}`);
        }

        const faces = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'face_recognition',
          'detect_faces',
          faces.length,
          faces.length * 750,
          faces.length * 1.5,
          { faceCount: faces.length }
        );

        return faces.map((face: any) => ({
          faceId: face.faceId,
          faceRectangle: face.faceRectangle,
          attributes: face.faceAttributes,
        }));
      }
    );
  }

  async verifyFaces(
    faceId1: string,
    faceId2: string
  ): Promise<ServiceResponse<FaceVerificationResult>> {
    return serviceProviderFactory.callWithFallback(
      'face_recognition',
      'verify_faces',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const response = await fetch(`${endpoint}/face/v1.0/verify`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            faceId1,
            faceId2,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Azure Face verification error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'face_recognition',
          'verify_faces',
          1,
          750,
          1.5,
          { confidence: result.confidence }
        );

        const verified = result.isIdentical && result.confidence > 0.7;

        return {
          isIdentical: result.isIdentical,
          confidence: result.confidence,
          verified,
          message: verified
            ? 'Identité vérifiée avec succès'
            : result.isIdentical
            ? 'Faible niveau de confiance'
            : 'Les visages ne correspondent pas',
        };
      }
    );
  }

  async verifyIdentity(
    selfieUrl: string,
    idPhotoUrl: string
  ): Promise<ServiceResponse<FaceVerificationResult>> {
    const selfieDetection = await this.detectFaces(selfieUrl);
    if (!selfieDetection.success || !selfieDetection.data || selfieDetection.data.length === 0) {
      return {
        success: false,
        error: 'Aucun visage détecté dans le selfie',
      };
    }

    const idPhotoDetection = await this.detectFaces(idPhotoUrl);
    if (!idPhotoDetection.success || !idPhotoDetection.data || idPhotoDetection.data.length === 0) {
      return {
        success: false,
        error: 'Aucun visage détecté dans la photo d\'identité',
      };
    }

    if (selfieDetection.data.length > 1) {
      return {
        success: false,
        error: 'Plusieurs visages détectés dans le selfie. Veuillez prendre une photo seul(e)',
      };
    }

    if (idPhotoDetection.data.length > 1) {
      return {
        success: false,
        error: 'Plusieurs visages détectés dans la photo d\'identité',
      };
    }

    const selfieFaceId = selfieDetection.data[0].faceId;
    const idPhotoFaceId = idPhotoDetection.data[0].faceId;

    return this.verifyFaces(selfieFaceId, idPhotoFaceId);
  }

  async verifyIdentityFromBlobs(
    selfieBlob: Blob,
    idPhotoBlob: Blob
  ): Promise<ServiceResponse<FaceVerificationResult>> {
    const selfieDetection = await this.detectFacesFromBlob(selfieBlob);
    if (!selfieDetection.success || !selfieDetection.data || selfieDetection.data.length === 0) {
      return {
        success: false,
        error: 'Aucun visage détecté dans le selfie',
      };
    }

    const idPhotoDetection = await this.detectFacesFromBlob(idPhotoBlob);
    if (!idPhotoDetection.success || !idPhotoDetection.data || idPhotoDetection.data.length === 0) {
      return {
        success: false,
        error: 'Aucun visage détecté dans la photo d\'identité',
      };
    }

    if (selfieDetection.data.length > 1) {
      return {
        success: false,
        error: 'Plusieurs visages détectés dans le selfie',
      };
    }

    if (idPhotoDetection.data.length > 1) {
      return {
        success: false,
        error: 'Plusieurs visages détectés dans la photo d\'identité',
      };
    }

    const selfieFaceId = selfieDetection.data[0].faceId;
    const idPhotoFaceId = idPhotoDetection.data[0].faceId;

    return this.verifyFaces(selfieFaceId, idPhotoFaceId);
  }

  async detectLiveness(
    videoBlob: Blob
  ): Promise<ServiceResponse<LivenessDetectionResult>> {
    return serviceProviderFactory.callWithFallback(
      'face_recognition',
      'detect_liveness',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const videoBuffer = await videoBlob.arrayBuffer();

        const response = await fetch(
          `${endpoint}/face/v1.0/detectLiveness/singleModal`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/octet-stream',
            },
            body: videoBuffer,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Liveness detection error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'face_recognition',
          'detect_liveness',
          1,
          7500,
          15,
          { status: result.livenessDecision }
        );

        return {
          isLive: result.livenessDecision === 'realface',
          confidence: result.livenessConfidence || 0,
          status: result.livenessDecision,
        };
      }
    );
  }

  async analyzeFaceAttributes(
    imageUrl: string
  ): Promise<ServiceResponse<{
    age: number;
    gender: string;
    emotion: string;
    dominantEmotion: string;
    glasses: string;
  }>> {
    const detection = await this.detectFaces(imageUrl, true);

    if (!detection.success || !detection.data || detection.data.length === 0) {
      return {
        success: false,
        error: 'Aucun visage détecté',
      };
    }

    const face = detection.data[0];
    const attributes = face.attributes;

    if (!attributes) {
      return {
        success: false,
        error: 'Attributs non disponibles',
      };
    }

    const emotions = attributes.emotion || {};
    const dominantEmotion = Object.entries(emotions).reduce(
      (max, [emotion, value]) => (value > max.value ? { emotion, value } : max),
      { emotion: 'neutral', value: 0 }
    );

    return {
      success: true,
      data: {
        age: attributes.age || 0,
        gender: attributes.gender || 'unknown',
        emotion: JSON.stringify(emotions),
        dominantEmotion: dominantEmotion.emotion,
        glasses: attributes.glasses || 'unknown',
      },
    };
  }
}

export const azureFaceService = new AzureFaceService();
