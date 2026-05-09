import "dotenv/config";
import * as bcrypt from "bcrypt";

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

  await client.end();
  console.log('\n✓ Database seeding complete!');
}

main().catch((e) => {
  console.error('Error seeding database:', e);
  process.exit(1);
});