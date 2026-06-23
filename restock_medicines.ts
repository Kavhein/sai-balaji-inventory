import dns from 'dns';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['192.168.29.1', '1.1.1.1', '8.8.8.8']);
} catch (dnsErr) {
  // ignore
}

const originalLookup = dns.lookup;
const patchedLookup = (hostname: any, options: any, callback: any) => {
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
dns.lookup = patchedLookup as any;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Restocking all medicines to 1000...');
  
  const result = await prisma.medicine.updateMany({
    data: {
      stock_quantity: 1000
    }
  });
  
  console.log(`Successfully updated ${result.count} medicines to stock_quantity = 1000.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
