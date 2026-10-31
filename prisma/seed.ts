import { PrismaClient, ComponentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Accounts that older versions of this script created with hard-coded values.
// They are removed on seed so reseeding with new credentials does not leave
// duplicate admins/technicians behind.
const LEGACY_PLACEHOLDER_EMAILS = [
  'admin@example.com',
  'staff@example.com',
  'tech@example.com',
];

interface SeedConfig {
  adminEmail: string;
  adminPassword: string;
  techEmail: string;
  techPassword: string;
}

function readSeedConfig(): SeedConfig {
  if (process.env.ALLOW_SEED !== 'true') {
    console.error(
      'Refusing to seed: seeding deletes lab data. Set ALLOW_SEED=true to confirm you are ' +
        'targeting a throwaway/demo database.',
    );
    process.exit(1);
  }

  const required = [
    'SEED_ADMIN_EMAIL',
    'SEED_ADMIN_PASSWORD',
    'SEED_TECH_EMAIL',
    'SEED_TECH_PASSWORD',
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    console.error(
      `Refusing to seed: missing required environment variables: ${missing.join(', ')}.`,
    );
    process.exit(1);
  }

  return {
    adminEmail: process.env.SEED_ADMIN_EMAIL!.trim(),
    adminPassword: process.env.SEED_ADMIN_PASSWORD!,
    techEmail: process.env.SEED_TECH_EMAIL!.trim(),
    techPassword: process.env.SEED_TECH_PASSWORD!,
  };
}

async function main() {
  const config = readSeedConfig();

  console.log('Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.installedApplication.deleteMany();
  await prisma.computerComponent.deleteMany();
  await prisma.computerUnit.deleteMany();
  await prisma.laboratoryRoom.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.requestItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  const stalePlaceholders = LEGACY_PLACEHOLDER_EMAILS.filter(
    (email) => email !== config.adminEmail && email !== config.techEmail,
  );
  if (stalePlaceholders.length > 0) {
    await prisma.user.deleteMany({
      where: { email: { in: stalePlaceholders } },
    });
  }
  console.log('Cleaned existing data.');

  const hashedPassword = await bcrypt.hash(config.adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: config.adminEmail },
    update: { password_hash: hashedPassword, role: 'ADMIN' },
    create: {
      email: config.adminEmail,
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });

  const techPassword = await bcrypt.hash(config.techPassword, 10);
  await prisma.user.upsert({
    where: { email: config.techEmail },
    update: { password_hash: techPassword, role: 'TECHNICIAN' },
    create: {
      email: config.techEmail,
      password_hash: techPassword,
      role: 'TECHNICIAN',
    },
  });

  const roomLR2 = await prisma.laboratoryRoom.upsert({
    where: { name: 'LR2' },
    update: {},
    create: { name: 'LR2', created_by: admin.id, updated_by: admin.id },
  });

  const roomMM3 = await prisma.laboratoryRoom.upsert({
    where: { name: 'MM3' },
    update: {},
    create: { name: 'MM3', created_by: admin.id, updated_by: admin.id },
  });

  const roomLR4 = await prisma.laboratoryRoom.upsert({
    where: { name: 'LR4' },
    update: {},
    create: { name: 'LR4', created_by: admin.id, updated_by: admin.id },
  });

  // NOTE: ComputerUnit has no case/chassis column in the schema, so the
  // case model per unit (Trigon, Galaxy, etc.) is documented here in the
  // seed source only. If case needs to be queryable, add a migration.
  const lr2UnitData = [
    { unitName: 'LR201', caseModel: 'Trigon' },
    { unitName: 'LR203', caseModel: 'Trigon' },
    { unitName: 'LR204', caseModel: 'Neutron Odyssey' },
    { unitName: 'LR205', caseModel: 'Trendsonic' },
    { unitName: 'LR206', caseModel: 'Generic' },
    { unitName: 'LR207', caseModel: 'Generic' },
    { unitName: 'LR209', caseModel: 'Powerlogic' },
    { unitName: 'LR211', caseModel: 'Galaxy' },
    { unitName: 'LR212', caseModel: 'Powerlogic' },
    { unitName: 'LR213', caseModel: 'Galaxy' },
    { unitName: 'LR214', caseModel: 'Trendsonic' },
    { unitName: 'LR215', caseModel: 'Trendsonic' },
    { unitName: 'LR216', caseModel: 'Powerlogic' },
  ];

  const mm3UnitNames = Array.from(
    { length: 26 },
    (_, i) => `MM3${String(i + 1).padStart(2, '0')}`,
  );

  // LR4: LR4U01-LR4U15 standard working units, LR4U16/LR4U17 custom storage,
  // LR4U18-LR4U25 defective/broken units (mapped to NEEDS_REPLACEMENT).
  const lr4UnitNames = Array.from(
    { length: 17 },
    (_, i) => `LR4U${String(i + 1).padStart(2, '0')}`,
  );
  const lr4BrokenUnitNames = Array.from(
    { length: 8 },
    (_, i) => `LR4U${String(i + 18).padStart(2, '0')}`,
  );

  await prisma.computerUnit.createMany({
    data: [
      ...lr2UnitData.map((u) => ({
        unit_name: u.unitName,
        laboratory_room_id: roomLR2.id,
        created_by: admin.id,
        updated_by: admin.id,
      })),
      ...mm3UnitNames.map((unitName) => ({
        unit_name: unitName,
        laboratory_room_id: roomMM3.id,
        created_by: admin.id,
        updated_by: admin.id,
      })),
      ...[...lr4UnitNames, ...lr4BrokenUnitNames].map((unitName) => ({
        unit_name: unitName,
        laboratory_room_id: roomLR4.id,
        created_by: admin.id,
        updated_by: admin.id,
      })),
    ],
  });

  // Each room gets its own component set below.
  const lr2Units = await prisma.computerUnit.findMany({
    where: { laboratory_room_id: roomLR2.id },
  });
  const mm3Units = await prisma.computerUnit.findMany({
    where: { laboratory_room_id: roomMM3.id },
  });
  const lr4Units = await prisma.computerUnit.findMany({
    where: { laboratory_room_id: roomLR4.id },
  });
  console.log(`Seeded rooms and units (${lr2Units.length + mm3Units.length + lr4Units.length} units).`);

  type CompSpec = { type: ComponentType; spec: string };

  // LR2 default peripherals. Requested status "WORKING" maps to the
  // schema's ComponentStatus.FUNCTIONAL (only FUNCTIONAL /
  // NEEDS_REPAIR / NEEDS_REPLACEMENT exist).
  const lr2MonitorOverrides: Record<string, string> = {
    LR201: 'Acer V196HQL 18.5"',
    LR203: 'Chimei 19" LCD',
    LR204: 'LG Flatron 19"',
    LR213: 'Dell E1916HV 19.5"',
  };

  type LR2Peripheral = { type: ComponentType; spec: string };
  const lr2ComponentData = [];
  for (const unit of lr2Units) {
    const peripherals: LR2Peripheral[] = [
      { type: 'MOUSE', spec: 'A4Tech OP-620D Optical Mouse' },
      { type: 'KEYBOARD', spec: 'A4Tech KBS-720 Standard USB' },
      { type: 'MONITOR', spec: lr2MonitorOverrides[unit.unit_name] ?? 'Generic 18.5" LCD' },
    ];
    for (const p of peripherals) {
      lr2ComponentData.push({
        computer_unit_id: unit.id,
        type: p.type,
        specifications: p.spec,
        status: 'FUNCTIONAL' as const,
      });
    }
  }
  await prisma.computerComponent.createMany({ data: lr2ComponentData });

  // MM3 component set: AMD Ryzen 5 5600GT build with Inplay STX390 combo.
  const mm3ComponentSpecs: CompSpec[] = [
    { type: 'MOTHERBOARD', spec: 'A520MHP 2.0' },
    { type: 'PROCESSOR', spec: 'AMD Ryzen 5 5600GT with Radeon Graphics' },
    { type: 'MEMORY', spec: '16.0 GB RAM' },
    { type: 'STORAGE', spec: '238 GB SSD' },
    { type: 'KEYBOARD', spec: 'Inplay STX390 Rainbow LED Keyboard' },
    { type: 'MOUSE', spec: 'Inplay STX390 Rainbow LED Mouse' },
  ];

  const mm3ComponentData = [];
  for (const unit of mm3Units) {
    for (const cs of mm3ComponentSpecs) {
      mm3ComponentData.push({
        computer_unit_id: unit.id,
        type: cs.type,
        specifications: cs.spec,
        status: 'FUNCTIONAL' as const,
      });
    }
  }
  await prisma.computerComponent.createMany({ data: mm3ComponentData });

  // LR4 component set: Intel Core i7-10700 build. LR4U16/LR4U17 get custom
  // storage and a Samsung monitor; LR4U18-LR4U25 are defective units, so
  // every component is flagged NEEDS_REPLACEMENT (closest existing enum).
  const lr4SpecsFor = (unitName: string): CompSpec[] => {
    const isCustomMonitor = unitName === 'LR4U16' || unitName === 'LR4U17';
    const storage =
      unitName === 'LR4U16'
        ? '1.02 TB Storage'
        : unitName === 'LR4U17'
          ? '112 GB SSD Storage'
          : '500GB HDD';
    return [
      { type: 'MOTHERBOARD', spec: 'Intel 11th Gen' },
      { type: 'PROCESSOR', spec: 'Intel Core i7-10700 CPU @ 2.90GHz' },
      { type: 'MEMORY', spec: '16.0 GB RAM' },
      { type: 'STORAGE', spec: storage },
      { type: 'MONITOR', spec: isCustomMonitor ? 'Samsung 19" LED' : 'Generic 19" LCD' },
      { type: 'KEYBOARD', spec: 'Generic USB Keyboard' },
      { type: 'MOUSE', spec: 'Generic USB Optical Mouse' },
    ];
  };

  const lr4ComponentData = [];
  for (const unit of lr4Units) {
    const isBroken = lr4BrokenUnitNames.includes(unit.unit_name);
    for (const cs of lr4SpecsFor(unit.unit_name)) {
      lr4ComponentData.push({
        computer_unit_id: unit.id,
        type: cs.type,
        specifications: cs.spec,
        status: isBroken ? ('NEEDS_REPLACEMENT' as const) : ('FUNCTIONAL' as const),
      });
    }
  }
  await prisma.computerComponent.createMany({ data: lr4ComponentData });
  console.log('Seeded components and applications.');

  const lr2UnitCount = await prisma.computerUnit.count({
    where: { laboratory_room_id: roomLR2.id },
  });
  const lr2PeripheralCount = await prisma.computerComponent.count({
    where: { computer_unit: { laboratory_room_id: roomLR2.id } },
  });
  console.log(`LR2 verification: ${lr2UnitCount} units, ${lr2PeripheralCount} peripherals (expected 13 / 39)`);
  if (lr2UnitCount !== 13 || lr2PeripheralCount !== 39) {
    throw new Error('LR2 seed verification failed: expected 13 units and 39 peripherals');
  }

  const mm3UnitCount = await prisma.computerUnit.count({
    where: { laboratory_room_id: roomMM3.id },
  });
  const mm3ComponentCount = await prisma.computerComponent.count({
    where: { computer_unit: { laboratory_room_id: roomMM3.id } },
  });
  console.log(`MM3 verification: ${mm3UnitCount} units, ${mm3ComponentCount} components (expected 26 / 156)`);
  if (mm3UnitCount !== 26 || mm3ComponentCount !== 156) {
    throw new Error('MM3 seed verification failed: expected 26 units and 156 components');
  }

  const lr4UnitCount = await prisma.computerUnit.count({
    where: { laboratory_room_id: roomLR4.id },
  });
  const lr4ComponentCount = await prisma.computerComponent.count({
    where: { computer_unit: { laboratory_room_id: roomLR4.id } },
  });
  const lr4BrokenComponentCount = await prisma.computerComponent.count({
    where: {
      computer_unit: { laboratory_room_id: roomLR4.id },
      status: 'NEEDS_REPLACEMENT',
    },
  });
  console.log(
    `LR4 verification: ${lr4UnitCount} units, ${lr4ComponentCount} components, ` +
      `${lr4BrokenComponentCount} NEEDS_REPLACEMENT (expected 25 / 175 / 56)`,
  );
  if (lr4UnitCount !== 25 || lr4ComponentCount !== 175 || lr4BrokenComponentCount !== 56) {
    throw new Error(
      'LR4 seed verification failed: expected 25 units, 175 components, 56 NEEDS_REPLACEMENT',
    );
  }

  await prisma.inventoryItem.createMany({
    data: [
      { sku: 'KB-LOGI-K120', name: 'Logitech K120 Keyboard', quantity: 5, reorder_point: 2, component_type: 'KEYBOARD', created_by: admin.id, updated_by: admin.id },
      { sku: 'MS-LOGI-M90', name: 'Logitech M90 Mouse', quantity: 8, reorder_point: 3, component_type: 'MOUSE', created_by: admin.id, updated_by: admin.id },
      { sku: 'RAM-DDR3-8GB', name: '8GB DDR3 1600MHz RAM', quantity: 4, reorder_point: 2, component_type: 'MEMORY', created_by: admin.id, updated_by: admin.id },
      { sku: 'HDD-500GB-SG', name: '500GB Seagate HDD', quantity: 2, reorder_point: 1, component_type: 'STORAGE', created_by: admin.id, updated_by: admin.id },
      { sku: 'MON-SAM-20', name: 'Samsung 20" LED Monitor', quantity: 1, reorder_point: 1, component_type: 'MONITOR', created_by: admin.id, updated_by: admin.id },
      { sku: 'AVR-SERVO-500', name: 'Servo 500W AVR', quantity: 3, reorder_point: 1, component_type: 'AVR', created_by: admin.id, updated_by: admin.id },
      { sku: 'DVD-LG-GH24', name: 'LG GH24 DVD Writer', quantity: 2, reorder_point: 1, component_type: 'OPTICAL_DRIVE', created_by: admin.id, updated_by: admin.id },
    ],
  });

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
