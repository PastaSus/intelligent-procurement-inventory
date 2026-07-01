import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      password_hash: staffPassword,
      role: 'STAFF',
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

  type CompSpec = { type: string; spec: string };
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
  for (const unit of allUnits) {
    for (const cs of componentSpecs) {
      const serial = `${unit.unit_name}-${cs.type}-${String(serialCounter).padStart(4, '0')}`;
      await prisma.computerComponent.create({
        data: {
          computer_unit_id: unit.id,
          type: cs.type as any,
          serial_number: serial,
          specifications: cs.spec,
          status: 'FUNCTIONAL',
        },
      });
      serialCounter++;
    }
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
