import "dotenv/config";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";

async function main() {
  const { Client } = await import("pg");
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  
  const adminHash = await bcrypt.hash(adminPassword, 10);
  
  try {
    await client.query(
      `INSERT INTO "User" (id, email, password_hash, role, created_at, updated_at, created_by, updated_by, deleted)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, false)
       ON CONFLICT (email) DO NOTHING`,
      [
        `user_${Date.now()}_admin`,
        adminEmail,
        adminHash,
        'ADMIN',
        'system',
        'system'
      ]
    );
    console.log(`✓ Created/verified admin user: ${adminEmail}`);
  } catch (error) {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  }

  const staffEmail = 'staff@example.com';
  const staffPassword = 'staff123';
  
  const staffHash = await bcrypt.hash(staffPassword, 10);
  
  try {
    await client.query(
      `INSERT INTO "User" (id, email, password_hash, role, created_at, updated_at, created_by, updated_by, deleted)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, false)
       ON CONFLICT (email) DO NOTHING`,
      [
        `user_${Date.now()}_staff`,
        staffEmail,
        staffHash,
        'STAFF',
        'system',
        'system'
      ]
    );
    console.log(`✓ Created/verified staff user: ${staffEmail}`);
  } catch (error) {
    console.log(`✓ Staff user already exists: ${staffEmail}`);
  }

  const vendors = [
    { id: `vendor_${randomUUID()}_1`, name: 'Acme Supplies Co.', contact_name: 'John Smith', email: 'john@acmesupplies.com', phone: '555-0101', address: '123 Main St, Anytown, USA' },
    { id: `vendor_${randomUUID()}_2`, name: 'Global Parts Inc.', contact_name: 'Jane Doe', email: 'jane@globalparts.com', phone: '555-0102', address: '456 Oak Ave, Somewhere, USA' },
    { id: `vendor_${randomUUID()}_3`, name: 'FastShip Warehouse', contact_name: 'Bob Wilson', email: 'bob@fastship.com', phone: '555-0103', address: '789 Industrial Blvd, Cityville, USA' },
  ];

  for (const vendor of vendors) {
    try {
      await client.query(
        `INSERT INTO "Vendor" (id, name, contact_name, email, phone, address, created_at, updated_at, created_by, updated_by, deleted)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, false)
         ON CONFLICT DO NOTHING`,
        [vendor.id, vendor.name, vendor.contact_name, vendor.email, vendor.phone, vendor.address, 'system', 'system']
      );
      console.log(`✓ Created/verified vendor: ${vendor.name}`);
    } catch (error) {
      console.log(`✓ Vendor already exists: ${vendor.name}`);
    }
  }

  await client.end();
  console.log('\n✓ Database seeding complete!');
}

main().catch((e) => {
  console.error('Error seeding database:', e);
  process.exit(1);
});