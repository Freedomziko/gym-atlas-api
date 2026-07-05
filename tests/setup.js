require('dotenv').config();
process.env.USE_PG_MEM = process.env.USE_PG_MEM || 'true';
process.env.DEV_AUTH_USER_ID = process.env.DEV_AUTH_USER_ID || 'b2c3a47c-582a-4a6e-9015-eb9ff2e40e2f';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-test-key';
jest.setTimeout(10000);
