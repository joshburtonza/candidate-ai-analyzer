
import { supabase } from '@/integrations/supabase/client';

export interface BackendHealthCheck {
  database: boolean;
  storage: boolean;
  auth: boolean;
  realtime: boolean;
  errors: string[];
}

export const performBackendHealthCheck = async (): Promise<BackendHealthCheck> => {
  const result: BackendHealthCheck = {
    database: false,
    storage: false,
    auth: false,
    realtime: false,
    errors: []
  };

  try {
    // Test database connection using resumes table which has public read access
    const { data: dbTest, error: dbError } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);
    
    if (dbError) {
      result.errors.push(`Database: ${dbError.message}`);
    } else {
      result.database = true;
    }
  } catch (error: any) {
    result.errors.push(`Database connection failed: ${error.message}`);
  }

  try {
    // Test storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      result.errors.push(`Storage: ${storageError.message}`);
    } else {
      const cvBucket = buckets.find(b => b.name === 'cv-uploads');
      if (cvBucket) {
        result.storage = true;
      } else {
        result.errors.push('Storage: cv-uploads bucket not found');
      }
    }
  } catch (error: any) {
    result.errors.push(`Storage check failed: ${error.message}`);
  }

  try {
    // Test auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      result.errors.push(`Auth: ${authError.message}`);
    } else {
      result.auth = true;
    }
  } catch (error: any) {
    result.errors.push(`Auth check failed: ${error.message}`);
  }

  try {
    // Test realtime (basic channel creation)
    const channel = supabase.channel('health-check');
    if (channel) {
      result.realtime = true;
      // Clean up
      supabase.removeChannel(channel);
    }
  } catch (error: any) {
    result.errors.push(`Realtime check failed: ${error.message}`);
  }

  return result;
};

export const logBackendHealth = async () => {
  const health = await performBackendHealthCheck();
  
  console.log('=== BACKEND HEALTH CHECK ===');
  console.log('Database:', health.database ? '✅' : '❌');
  console.log('Storage:', health.storage ? '✅' : '❌');
  console.log('Auth:', health.auth ? '✅' : '❌');
  console.log('Realtime:', health.realtime ? '✅' : '❌');
  
  if (health.errors.length > 0) {
    console.log('Errors:');
    health.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('============================');
  
  return health;
};
