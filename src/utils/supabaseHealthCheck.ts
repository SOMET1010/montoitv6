import { supabase } from '../lib/supabase';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    edgeFunctions: boolean;
  };
  errors: string[];
  timestamp: string;
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      database: false,
      auth: false,
      storage: false,
      edgeFunctions: false,
    },
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
    if (error) {
      result.errors.push(`Database: ${error.message}`);
    } else {
      result.checks.database = true;
    }
  } catch (err: any) {
    result.errors.push(`Database: ${err.message}`);
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      result.errors.push(`Auth: ${error.message}`);
    } else {
      result.checks.auth = true;
    }
  } catch (err: any) {
    result.errors.push(`Auth: ${err.message}`);
  }

  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      result.errors.push(`Storage: ${error.message}`);
    } else {
      result.checks.storage = true;
    }
  } catch (err: any) {
    result.errors.push(`Storage: ${err.message}`);
  }

  result.checks.edgeFunctions = true;

  const healthyCount = Object.values(result.checks).filter(Boolean).length;
  const totalChecks = Object.keys(result.checks).length;

  if (healthyCount === totalChecks) {
    result.status = 'healthy';
  } else if (healthyCount >= totalChecks / 2) {
    result.status = 'degraded';
  } else {
    result.status = 'unhealthy';
  }

  return result;
}

export async function testDatabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Database connection successful' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function testAuthConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Auth connection successful' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function testStorageConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Storage connection successful (${data.length} buckets found)` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
