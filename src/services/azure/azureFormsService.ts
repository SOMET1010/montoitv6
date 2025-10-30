import { serviceProviderFactory, ServiceResponse } from '../providers/serviceProviderFactory';

export interface IDDocumentResult {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
  nationality: string;
  expirationDate?: string;
  address?: string;
  confidence: number;
}

export interface ReceiptResult {
  merchantName: string;
  merchantAddress: string;
  total: number;
  date: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
}

class AzureFormsService {
  async extractIDDocument(imageUrl: string): Promise<ServiceResponse<IDDocumentResult>> {
    return serviceProviderFactory.callWithFallback(
      'document_extraction',
      'extract_id',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const analyzeResponse = await fetch(
          `${endpoint}/formrecognizer/documentModels/prebuilt-idDocument:analyze?api-version=2023-07-31`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urlSource: imageUrl }),
          }
        );

        if (!analyzeResponse.ok) {
          const errorText = await analyzeResponse.text();
          throw new Error(`Form Recognizer error: ${analyzeResponse.status} - ${errorText}`);
        }

        const operationLocation = analyzeResponse.headers.get('Operation-Location');
        if (!operationLocation) {
          throw new Error('No operation location returned');
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        let attempts = 0;
        let result: any;

        while (attempts < 10) {
          const resultResponse = await fetch(operationLocation, {
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
            },
          });

          result = await resultResponse.json();

          if (result.status === 'succeeded') {
            break;
          } else if (result.status === 'failed') {
            throw new Error('Document analysis failed');
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (result.status !== 'succeeded') {
          throw new Error('Document analysis timeout');
        }

        const document = result.analyzeResult?.documents?.[0];
        if (!document) {
          throw new Error('No document found');
        }

        const fields = document.fields || {};

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'document_extraction',
          'extract_id',
          1,
          1000,
          2,
          { imageUrl }
        );

        return {
          firstName: fields.FirstName?.content || '',
          lastName: fields.LastName?.content || '',
          dateOfBirth: fields.DateOfBirth?.content || '',
          documentNumber: fields.DocumentNumber?.content || '',
          nationality: fields.CountryRegion?.content || '',
          expirationDate: fields.DateOfExpiration?.content,
          address: fields.Address?.content,
          confidence: document.confidence || 0,
        };
      }
    );
  }

  async extractIDDocumentFromBlob(imageBlob: Blob): Promise<ServiceResponse<IDDocumentResult>> {
    return serviceProviderFactory.callWithFallback(
      'document_extraction',
      'extract_id',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const imageBuffer = await imageBlob.arrayBuffer();

        const analyzeResponse = await fetch(
          `${endpoint}/formrecognizer/documentModels/prebuilt-idDocument:analyze?api-version=2023-07-31`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/octet-stream',
            },
            body: imageBuffer,
          }
        );

        if (!analyzeResponse.ok) {
          const errorText = await analyzeResponse.text();
          throw new Error(`Form Recognizer error: ${analyzeResponse.status} - ${errorText}`);
        }

        const operationLocation = analyzeResponse.headers.get('Operation-Location');
        if (!operationLocation) {
          throw new Error('No operation location returned');
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        let attempts = 0;
        let result: any;

        while (attempts < 10) {
          const resultResponse = await fetch(operationLocation, {
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
            },
          });

          result = await resultResponse.json();

          if (result.status === 'succeeded') {
            break;
          } else if (result.status === 'failed') {
            throw new Error('Document analysis failed');
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (result.status !== 'succeeded') {
          throw new Error('Document analysis timeout');
        }

        const document = result.analyzeResult?.documents?.[0];
        if (!document) {
          throw new Error('No document found');
        }

        const fields = document.fields || {};

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'document_extraction',
          'extract_id',
          1,
          1000,
          2
        );

        return {
          firstName: fields.FirstName?.content || '',
          lastName: fields.LastName?.content || '',
          dateOfBirth: fields.DateOfBirth?.content || '',
          documentNumber: fields.DocumentNumber?.content || '',
          nationality: fields.CountryRegion?.content || '',
          expirationDate: fields.DateOfExpiration?.content,
          address: fields.Address?.content,
          confidence: document.confidence || 0,
        };
      }
    );
  }

  async extractReceipt(imageUrl: string): Promise<ServiceResponse<ReceiptResult>> {
    return serviceProviderFactory.callWithFallback(
      'document_extraction',
      'extract_receipt',
      async (provider) => {
        const apiKey = provider.keys.api_key;
        const endpoint = provider.keys.endpoint;

        const analyzeResponse = await fetch(
          `${endpoint}/formrecognizer/documentModels/prebuilt-receipt:analyze?api-version=2023-07-31`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urlSource: imageUrl }),
          }
        );

        if (!analyzeResponse.ok) {
          const errorText = await analyzeResponse.text();
          throw new Error(`Form Recognizer error: ${analyzeResponse.status} - ${errorText}`);
        }

        const operationLocation = analyzeResponse.headers.get('Operation-Location');
        if (!operationLocation) {
          throw new Error('No operation location returned');
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        let attempts = 0;
        let result: any;

        while (attempts < 10) {
          const resultResponse = await fetch(operationLocation, {
            headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
            },
          });

          result = await resultResponse.json();

          if (result.status === 'succeeded') {
            break;
          } else if (result.status === 'failed') {
            throw new Error('Receipt analysis failed');
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }

        if (result.status !== 'succeeded') {
          throw new Error('Receipt analysis timeout');
        }

        const document = result.analyzeResult?.documents?.[0];
        if (!document) {
          throw new Error('No receipt found');
        }

        const fields = document.fields || {};

        await serviceProviderFactory.logProviderCost(
          provider.providerId,
          'document_extraction',
          'extract_receipt',
          1,
          1000,
          2,
          { imageUrl }
        );

        return {
          merchantName: fields.MerchantName?.content || '',
          merchantAddress: fields.MerchantAddress?.content || '',
          total: parseFloat(fields.Total?.content || '0'),
          date: fields.TransactionDate?.content || '',
          items: (fields.Items?.values || []).map((item: any) => ({
            description: item.properties?.Description?.content || '',
            quantity: parseFloat(item.properties?.Quantity?.content || '1'),
            price: parseFloat(item.properties?.Price?.content || '0'),
            totalPrice: parseFloat(item.properties?.TotalPrice?.content || '0'),
          })),
        };
      }
    );
  }
}

export const azureFormsService = new AzureFormsService();
