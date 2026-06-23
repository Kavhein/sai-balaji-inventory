const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['192.168.29.1', '1.1.1.1', '8.8.8.8']);
} catch (dnsErr) {
  // ignore
}

const originalLookup = dns.lookup;
const patchedLookup = (hostname, options, callback) => {
  let realCallback = callback;
  let realOptions = options;
  if (typeof options === 'function') {
    realCallback = options;
    realOptions = {};
  }

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    !hostname.includes('.')
  ) {
    return originalLookup(hostname, realOptions, realCallback);
  }

  let callbackCalled = false;
  const timer = setTimeout(() => {
    if (!callbackCalled) {
      callbackCalled = true;
      originalLookup(hostname, realOptions, realCallback);
    }
  }, 1000);

  dns.resolve4(hostname, (err, addresses) => {
    if (callbackCalled) return;
    callbackCalled = true;
    clearTimeout(timer);

    if (err || !addresses || addresses.length === 0) {
      originalLookup(hostname, realOptions, realCallback);
    } else {
      if (realOptions && realOptions.all) {
        const results = addresses.map((addr) => ({ address: addr, family: 4 }));
        realCallback(null, results);
      } else {
        realCallback(null, addresses[0], 4);
      }
    }
  });
};

Object.assign(patchedLookup, originalLookup);
dns.lookup = patchedLookup;

const { neon } = require('@neondatabase/serverless');

const databaseUrl = "postgresql://neondb_owner:npg_bmD4Zs2xuAjo@ep-solitary-recipe-a180svxa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log('Restocking all medicines to 1000 via HTTPS...');
  const sql = neon(databaseUrl);
  
  // Execute the update query
  console.log('Sending UPDATE query...');
  const result = await sql`UPDATE "Medicine" SET stock_quantity = 1000`;
  console.log('Update query finished.');
  
  // Verify the count and check sample data
  const countResult = await sql`SELECT count(*)::int as count FROM "Medicine" WHERE stock_quantity = 1000`;
  console.log(`Count of medicines with stock = 1000:`, countResult[0].count);
  
  const samples = await sql`SELECT id, name, stock_quantity FROM "Medicine" LIMIT 5`;
  console.log('Sample medicines:', samples);
}

main().catch(console.error);
