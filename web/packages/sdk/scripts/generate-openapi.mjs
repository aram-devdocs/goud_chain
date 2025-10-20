import { createClient } from '@hey-api/openapi-ts';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const OPENAPI_URL = `${BACKEND_URL}/api-docs/openapi.json`;
const LOCAL_SPEC = join(__dirname, '..', '.openapi', 'spec.json');

async function generate() {
  try {
    let inputSource = OPENAPI_URL;
    
    // Try to fetch from backend first
    try {
      console.log(`Attempting to fetch OpenAPI spec from ${OPENAPI_URL}...`);
      const response = await fetch(OPENAPI_URL);
      if (!response.ok) throw new Error('Backend not available');
    } catch (error) {
      console.log('⚠️  Backend not available, using local spec file...');
      inputSource = LOCAL_SPEC;
    }
    
    await createClient({
      client: '@hey-api/client-fetch',
      input: inputSource,
      output: join(__dirname, '..', 'src', 'generated'),
      schemas: false,
      types: {
        enums: 'javascript',
      },
    });

    console.log('✅ OpenAPI client generated successfully!');
    if (inputSource === LOCAL_SPEC) {
      console.log('📝 Note: Generated from local spec. Run with backend for full API coverage.');
    }
  } catch (error) {
    console.error('❌ Failed to generate OpenAPI client:', error.message);
    
    // If backend is not available, log helpful message
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      console.log('\n💡 Tip: Make sure the backend is running:');
      console.log('   ./run start\n');
    }
    
    process.exit(1);
  }
}

generate();
