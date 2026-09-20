import { getHardwareReport } from '@/app/_actions/reports';
import { HardwareReport } from './components/HardwareReport';

export default async function ReportsPage() {
  const result = await getHardwareReport();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Hardware Inventory Report</h2>
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
          <p>{result.error || 'Failed to load report data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <HardwareReport
      initialRooms={result.data.rooms}
      roomOptions={result.data.roomOptions}
    />
  );
}
