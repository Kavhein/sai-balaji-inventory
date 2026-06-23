// Direct SQL approach using @neondatabase/serverless
// This bypasses Prisma's binary engine and its DNS issues

const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '192.168.29.1']);
} catch (e) {}

// Monkey-patch dns.lookup to use dns.resolve4 for external hosts
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname.includes('.')) {
    return originalLookup.call(dns, hostname, options, callback);
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return originalLookup.call(dns, hostname, options, callback);
    }
    if (options && options.all) {
      callback(null, addresses.map(a => ({ address: a, family: 4 })));
    } else {
      callback(null, addresses[0], 4);
    }
  });
};

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_bmD4Zs2xuAjo@ep-solitary-recipe-a180svxa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function main() {
  console.log('Connecting to Neon database via serverless HTTP driver...\n');

  // Step 1: Get all medicines
  console.log('=== Step 1: Finding duplicate medicines ===');
  const allMedicines = await sql`SELECT id, name, category, stock_quantity FROM "Medicine" ORDER BY id ASC`;
  console.log(`Total medicines in DB: ${allMedicines.length}`);
  
  // Group by lowercase trimmed name
  const nameMap = new Map();
  for (const med of allMedicines) {
    const key = med.name.trim().toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key).push(med);
  }
  
  const duplicateGroups = [];
  const idsToDelete = [];
  
  for (const [name, meds] of nameMap.entries()) {
    if (meds.length > 1) {
      duplicateGroups.push({ name, count: meds.length, ids: meds.map(m => m.id) });
      for (let i = 1; i < meds.length; i++) {
        idsToDelete.push(meds[i].id);
      }
    }
  }
  
  console.log(`\nFound ${duplicateGroups.length} groups of duplicate medicines:`);
  for (const group of duplicateGroups) {
    console.log(`  "${group.name}" - ${group.count} copies (IDs: ${group.ids.join(', ')}) -> keeping ID ${group.ids[0]}, deleting [${group.ids.slice(1).join(', ')}]`);
  }
  console.log(`\nTotal duplicate records to delete: ${idsToDelete.length}`);
  
  if (idsToDelete.length > 0) {
    // Reassign InvoiceItems from duplicates to the kept medicine
    console.log('\n=== Reassigning InvoiceItems from duplicates to originals ===');
    
    for (const group of duplicateGroups) {
      const keepId = group.ids[0];
      const deleteIds = group.ids.slice(1);
      
      // Update invoice items to point to the kept medicine
      const result = await sql`
        UPDATE "InvoiceItem" 
        SET medicine_id = ${keepId} 
        WHERE medicine_id = ANY(${deleteIds})
      `;
      console.log(`  Processed group "${group.name}": keep ID ${keepId}, reassigned items from [${deleteIds.join(', ')}]`);
    }
    
    // Delete the duplicates
    console.log('\n=== Deleting duplicate medicine records ===');
    const deleteResult = await sql`DELETE FROM "Medicine" WHERE id = ANY(${idsToDelete})`;
    console.log(`Deleted duplicate medicine records.`);
  } else {
    console.log('No duplicates found!');
  }
  
  // Step 2: Update all remaining medicines to stock_quantity = 1000
  console.log('\n=== Step 2: Restocking all medicines to 1000 ===');
  const updateResult = await sql`UPDATE "Medicine" SET stock_quantity = 1000`;
  console.log(`Updated medicines to stock_quantity = 1000.`);
  
  // Step 3: Summary
  console.log('\n=== Final Summary ===');
  const countResult = await sql`SELECT COUNT(*) as count FROM "Medicine"`;
  console.log(`Total unique medicines in DB: ${countResult[0].count}`);
  
  const samples = await sql`SELECT id, name, category, stock_quantity FROM "Medicine" ORDER BY id ASC LIMIT 10`;
  console.log('\nSample medicines (first 10):');
  for (const s of samples) {
    console.log(`  ID ${s.id}: ${s.name} [${s.category}] -> stock: ${s.stock_quantity}`);
  }
  
  // Verify no duplicates remain
  const dupCheck = await sql`
    SELECT LOWER(TRIM(name)) as med_name, COUNT(*) as cnt 
    FROM "Medicine" 
    GROUP BY LOWER(TRIM(name)) 
    HAVING COUNT(*) > 1
  `;
  if (dupCheck.length === 0) {
    console.log('\n✓ No duplicates remain in the database.');
  } else {
    console.log('\n⚠ Still found duplicates:');
    for (const d of dupCheck) {
      console.log(`  "${d.med_name}" - ${d.cnt} copies`);
    }
  }
}

main()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
