import { supabase } from '../../lib/supabase';

export interface ProviderConfig {
  providerId: string;
  serviceName: string;
  displayName: string;
  keys: Record<string, string>;
  isPrimary: boolean;
  priority: number;
  healthStatus: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
  cost?: {
    units: number;
    fcfa: number;
    usd: number;
  };
}

export interface ProviderCallOptions {
  maxRetries?: number;
  timeout?: number;
  enableFallback?: boolean;
  logCost?: boolean;
}

class ServiceProviderFactory {
  private providerCache: Map<string, ProviderConfig[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async getProviders(serviceCategory: string): Promise<ProviderConfig[]> {
    const now = Date.now();
    const cached = this.providerCache.get(serviceCategory);
    const expiry = this.cacheExpiry.get(serviceCategory);

    if (cached && expiry && expiry > now) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          id,
          is_primary,
          priority_order,
          api_keys:provider_id (
            id,
            service_name,
            display_name,
            keys,
            is_active,
            health_status
          )
        `)
        .eq('service_category', serviceCategory)
        .order('is_primary', { ascending: false })
        .order('priority_order', { ascending: true });

      if (error) throw error;

      const providers: ProviderConfig[] = (data || [])
        .filter((item: any) => item.api_keys?.is_active)
        .map((item: any) => ({
          providerId: item.api_keys.id,
          serviceName: item.api_keys.service_name,
          displayName: item.api_keys.display_name,
          keys: item.api_keys.keys,
          isPrimary: item.is_primary,
          priority: item.priority_order,
          healthStatus: item.api_keys.health_status,
        }));

      this.providerCache.set(serviceCategory, providers);
      this.cacheExpiry.set(serviceCategory, now + this.CACHE_TTL);

      return providers;
    } catch (error) {
      console.error(`Error loading providers for ${serviceCategory}:`, error);
      return [];
    }
  }

  async callWithFallback<T>(
    serviceCategory: string,
    operationType: string,
    callFunction: (provider: ProviderConfig) => Promise<T>,
    options: ProviderCallOptions = {}
  ): Promise<ServiceResponse<T>> {
    const {
      maxRetries = 3,
      timeout = 30000,
      enableFallback = true,
      logCost = true,
    } = options;

    const providers = await this.getProviders(serviceCategory);

    if (providers.length === 0) {
      return {
        success: false,
        error: `No active providers configured for ${serviceCategory}`,
      };
    }

    const healthyProviders = providers.filter(
      (p) => p.healthStatus === 'healthy' || p.healthStatus === 'unknown'
    );

    const providersToTry = healthyProviders.length > 0 ? healthyProviders : providers;

    for (let i = 0; i < providersToTry.length; i++) {
      const provider = providersToTry[i];
      const startTime = Date.now();
      let lastError: any = null;

      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          const result = await this.executeWithTimeout(
            callFunction(provider),
            timeout
          );

          const duration = Date.now() - startTime;

          await this.updateProviderHealth(provider.providerId, 'healthy', duration);

          if (i > 0) {
            await this.logFailover(
              serviceCategory,
              providersToTry[0].providerId,
              provider.providerId,
              `Primary provider failed, switched to ${provider.displayName}`,
              lastError?.message,
              duration
            );
          }

          return {
            success: true,
            data: result,
            provider: provider.displayName,
          };
        } catch (error: any) {
          lastError = error;
          console.error(
            `Provider ${provider.displayName} failed (attempt ${retry + 1}/${maxRetries}):`,
            error
          );

          if (retry === maxRetries - 1) {
            await this.updateProviderHealth(
              provider.providerId,
              'unhealthy',
              Date.now() - startTime,
              error.message
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * (retry + 1)));
        }
      }

      if (!enableFallback || i === providersToTry.length - 1) {
        return {
          success: false,
          error: lastError?.message || 'All providers failed',
          provider: provider.displayName,
        };
      }
    }

    return {
      success: false,
      error: 'All providers exhausted',
    };
  }

  private executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }

  private async updateProviderHealth(
    providerId: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTimeMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.rpc('update_provider_health', {
        p_provider_id: providerId,
        p_status: status,
        p_response_time_ms: responseTimeMs,
        p_error_message: errorMessage || null,
      });
    } catch (error) {
      console.error('Error updating provider health:', error);
    }
  }

  private async logFailover(
    serviceCategory: string,
    fromProviderId: string,
    toProviderId: string,
    reason: string,
    errorDetails?: string,
    durationMs?: number
  ): Promise<void> {
    try {
      await supabase.rpc('log_provider_failover', {
        p_service_category: serviceCategory,
        p_from_provider_id: fromProviderId,
        p_to_provider_id: toProviderId,
        p_reason: reason,
        p_error_details: errorDetails || null,
        p_failover_duration_ms: durationMs || null,
      });
    } catch (error) {
      console.error('Error logging failover:', error);
    }
  }

  async logProviderCost(
    providerId: string,
    serviceCategory: string,
    operationType: string,
    units: number,
    costFcfa: number,
    costUsd: number = 0,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.rpc('log_provider_cost', {
        p_provider_id: providerId,
        p_service_category: serviceCategory,
        p_operation_type: operationType,
        p_units_used: units,
        p_cost_fcfa: costFcfa,
        p_cost_usd: costUsd,
        p_metadata: metadata || null,
      });
    } catch (error) {
      console.error('Error logging provider cost:', error);
    }
  }

  clearCache(serviceCategory?: string): void {
    if (serviceCategory) {
      this.providerCache.delete(serviceCategory);
      this.cacheExpiry.delete(serviceCategory);
    } else {
      this.providerCache.clear();
      this.cacheExpiry.clear();
    }
  }

  async getProviderStats(serviceCategory: string): Promise<{
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    totalCostFcfa: number;
    totalCostUsd: number;
  }> {
    try {
      const providers = await this.getProviders(serviceCategory);
      const providerIds = providers.map((p) => p.providerId);

      const { data: costs, error: costsError } = await supabase
        .from('provider_usage_costs')
        .select('units_used, cost_fcfa, cost_usd')
        .in('provider_id', providerIds)
        .eq('service_category', serviceCategory);

      if (costsError) throw costsError;

      const { data: healthChecks, error: healthError } = await supabase
        .from('provider_health_checks')
        .select('status, response_time_ms')
        .in('provider_id', providerIds)
        .order('checked_at', { ascending: false })
        .limit(100);

      if (healthError) throw healthError;

      const totalCalls = healthChecks?.length || 0;
      const successfulCalls = healthChecks?.filter((h) => h.status === 'healthy').length || 0;
      const avgResponseTime = healthChecks?.length
        ? healthChecks.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / healthChecks.length
        : 0;

      const totalCostFcfa = costs?.reduce((sum, c) => sum + Number(c.cost_fcfa || 0), 0) || 0;
      const totalCostUsd = costs?.reduce((sum, c) => sum + Number(c.cost_usd || 0), 0) || 0;

      return {
        totalCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        totalCostFcfa: Math.round(totalCostFcfa),
        totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting provider stats:', error);
      return {
        totalCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        totalCostFcfa: 0,
        totalCostUsd: 0,
      };
    }
  }
}

export const serviceProviderFactory = new ServiceProviderFactory();
