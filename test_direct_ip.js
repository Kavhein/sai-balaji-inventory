// Direct connection using known IPs for Neon database
// Bypasses DNS entirely by connecting to known IP with TLS SNI

const https = require('https');
const tls = require('tls');
const { URL } = require('url');

const NEON_IPS = ['13.228.46.236', '52.220.170.93', '13.228.184.177'];
const NEON_HOST = 'ep-solitary-recipe-a180svxa-pooler.ap-southeast-1.aws.neon.tech';
const DB_USER = 'neondb_owner';
const DB_PASS = 'npg_bmD4Zs2xuAjo';
const DB_NAME = 'neondb';

// Use Neon's SQL over HTTP API
const API_HOST = 'api.ap-southeast-1.aws.neon.tech';
// We need the API IP too - let's try the same IPs or resolve separately

async function neonHttpQuery(sqlQuery, params = []) {
  // Try each IP in succession
  for (const ip of NEON_IPS) {
    try {
      const result = await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          query: sqlQuery,
          params: params,
        });

        const options = {
          hostname: ip,
          port: 443,
          path: '/sql',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': `postgresql://${DB_USER}:${DB_PASS}@${NEON_HOST}/${DB_NAME}?sslmode=require`,
            'Content-Length': Buffer.byteLength(postData),
            'Host': API_HOST,
          },
          servername: API_HOST, // TLS SNI
          rejectUnauthorized: true,
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                resolve(JSON.parse(data));
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${data}`));
              }
            } catch (e) {
              reject(new Error(`Parse error: ${data}`));
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.write(postData);
        req.end();
      });
      return result;
    } catch (err) {
      console.log(`  IP ${ip} failed: ${err.message}`);
      continue;
    }
  }
  throw new Error('All IPs failed');
}

async function main() {
  console.log('Testing direct IP connection to Neon...\n');
  
  try {
    const result = await neonHttpQuery('SELECT COUNT(*) as count FROM "Medicine"');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
    
    // Try with node-fetch and custom agent as fallback
    console.log('\nTrying fetch with custom agent...');
    const { default: fetch } = await import('node-fetch');
    
    for (const ip of NEON_IPS) {
      try {
        console.log(`\nTrying IP: ${ip}`);
        const agent = new https.Agent({
          servername: API_HOST,
        });
        
        const connStr = `postgresql://${DB_USER}:${DB_PASS}@${NEON_HOST}/${DB_NAME}?sslmode=require`;
        
        const res = await fetch(`https://${ip}/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': connStr,
            'Host': API_HOST,
          },
          body: JSON.stringify({
            query: 'SELECT 1 as test',
            params: [],
          }),
          agent: agent,
          timeout: 15000,
        });
        
        const data = await res.text();
        console.log(`Response (${res.status}):`, data.substring(0, 500));
        break;
      } catch (e) {
        console.log(`  Failed: ${e.message}`);
      }
    }
  }
}

main().catch(console.error);
