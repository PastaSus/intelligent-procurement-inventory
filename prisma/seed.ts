import { PrismaClient, ComponentType, LicenseType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'aarongtxd@gmail.com' },
    update: {},
    create: {
      email: 'aarongtxd@gmail.com',
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });

  const techPassword = await bcrypt.hash('tech123', 10);
  await prisma.user.deleteMany({ where: { email: 'staff@example.com' } });
  await prisma.user.upsert({
    where: { email: 'tech@example.com' },
    update: { password_hash: techPassword, role: 'TECHNICIAN' },
    create: {
      email: 'tech@example.com',
      password_hash: techPassword,
      role: 'TECHNICIAN',
    },
  });

  const roomA = await prisma.laboratoryRoom.upsert({
    where: { name: 'Laboratory 127A' },
    update: {},
    create: { name: 'Laboratory 127A', created_by: admin.id, updated_by: admin.id },
  });

  const roomB = await prisma.laboratoryRoom.upsert({
    where: { name: 'Laboratory 127B' },
    update: {},
    create: { name: 'Laboratory 127B', created_by: admin.id, updated_by: admin.id },
  });

  const roomC = await prisma.laboratoryRoom.upsert({
    where: { name: 'Laboratory 128A' },
    update: {},
    create: { name: 'Laboratory 128A', created_by: admin.id, updated_by: admin.id },
  });

  const roomLR2 = await prisma.laboratoryRoom.upsert({
    where: { name: 'LR2' },
    update: {},
    create: { name: 'LR2', created_by: admin.id, updated_by: admin.id },
  });

  const unitData = [
    { unitName: 'LR1U01', roomId: roomA.id },
    { unitName: 'LR1U02', roomId: roomA.id },
    { unitName: 'LR1U03', roomId: roomA.id },
    { unitName: 'LR2U01', roomId: roomB.id },
    { unitName: 'LR2U02', roomId: roomB.id },
    { unitName: 'LR3U01', roomId: roomC.id },
  ];

  for (const u of unitData) {
    await prisma.computerUnit.upsert({
      where: { unit_name_laboratory_room_id: { unit_name: u.unitName, laboratory_room_id: u.roomId } },
      update: {},
      create: {
        unit_name: u.unitName,
        laboratory_room_id: u.roomId,
        created_by: admin.id,
        updated_by: admin.id,
      },
    });
  }

  const allUnits = await prisma.computerUnit.findMany();

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

  for (const u of lr2UnitData) {
    await prisma.computerUnit.upsert({
      where: { unit_name_laboratory_room_id: { unit_name: u.unitName, laboratory_room_id: roomLR2.id } },
      update: {},
      create: {
        unit_name: u.unitName,
        laboratory_room_id: roomLR2.id,
        created_by: admin.id,
        updated_by: admin.id,
      },
    });
  }

  // Standard rooms keep the full 9-component generic set; LR2 units get
  // only the 3 specified peripherals below (no duplicate types per unit).
  const standardUnits = allUnits;
  const lr2Units = await prisma.computerUnit.findMany({
    where: { laboratory_room_id: roomLR2.id },
  });

  type CompSpec = { type: ComponentType; spec: string };
  const componentSpecs: CompSpec[] = [
    { type: 'MOTHERBOARD', spec: 'Gigabyte GA-H81M-DS2V' },
    { type: 'PROCESSOR', spec: 'Intel Core i5 4460' },
    { type: 'MEMORY', spec: '8GB DDR3 1600MHz' },
    { type: 'HDD', spec: '500GB Seagate Barracuda' },
    { type: 'MONITOR', spec: 'Samsung 20" LED' },
    { type: 'KEYBOARD', spec: 'Logitech K120' },
    { type: 'MOUSE', spec: 'Logitech M90' },
    { type: 'AVR', spec: 'Servo 500W AVR' },
    { type: 'OPTICAL_DRIVE', spec: 'LG GH24 DVD Writer' },
  ];

  let serialCounter = 1;
  for (const unit of standardUnits) {
    for (const cs of componentSpecs) {
      const serial = `${unit.unit_name}-${cs.type}-${String(serialCounter).padStart(4, '0')}`;
      await prisma.computerComponent.create({
        data: {
          computer_unit_id: unit.id,
          type: cs.type,
          serial_number: serial,
          specifications: cs.spec,
          status: 'FUNCTIONAL',
        },
      });
      serialCounter++;
    }
  }

  type AppSpec = { name: string; version: string; licenseType: LicenseType };
  const appSpecs: AppSpec[] = [
    { name: 'Windows 11 Pro', version: '23H2', licenseType: 'COMMERCIAL' },
    { name: 'Microsoft Office 2021', version: '16.0', licenseType: 'COMMERCIAL' },
    { name: 'Google Chrome', version: '131.0', licenseType: 'FREE' },
  ];

  for (const unit of standardUnits) {
    for (const app of appSpecs) {
      await prisma.installedApplication.create({
        data: {
          computer_unit_id: unit.id,
          name: app.name,
          version: app.version,
          license_type: app.licenseType,
        },
      });
    }
  }

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
  let lr2Serial = 1;
  for (const unit of lr2Units) {
    const peripherals: LR2Peripheral[] = [
      { type: 'MOUSE', spec: 'A4Tech OP-620D Optical Mouse' },
      { type: 'KEYBOARD', spec: 'A4Tech KBS-720 Standard USB' },
      { type: 'MONITOR', spec: lr2MonitorOverrides[unit.unit_name] ?? 'Generic 18.5" LCD' },
    ];
    for (const p of peripherals) {
      const serial = `${unit.unit_name}-${p.type}-LR2-${String(lr2Serial).padStart(3, '0')}`;
      await prisma.computerComponent.create({
        data: {
          computer_unit_id: unit.id,
          type: p.type,
          serial_number: serial,
          specifications: p.spec,
          status: 'FUNCTIONAL',
        },
      });
      lr2Serial++;
    }
  }

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

  await prisma.inventoryItem.createMany({
    data: [
      { sku: 'KB-LOGI-K120', name: 'Logitech K120 Keyboard', quantity: 5, reorder_point: 2, component_type: 'KEYBOARD', created_by: admin.id, updated_by: admin.id },
      { sku: 'MS-LOGI-M90', name: 'Logitech M90 Mouse', quantity: 8, reorder_point: 3, component_type: 'MOUSE', created_by: admin.id, updated_by: admin.id },
      { sku: 'RAM-DDR3-8GB', name: '8GB DDR3 1600MHz RAM', quantity: 4, reorder_point: 2, component_type: 'MEMORY', created_by: admin.id, updated_by: admin.id },
      { sku: 'HDD-500GB-SG', name: '500GB Seagate HDD', quantity: 2, reorder_point: 1, component_type: 'HDD', created_by: admin.id, updated_by: admin.id },
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
