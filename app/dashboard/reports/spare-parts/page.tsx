import { getSparePartsReport } from '@/app/_actions/reports';
import { SparePartsReport } from './SparePartsReport';

export default async function SparePartsReportPage() {
  const result = await getSparePartsReport();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Spare Parts &amp; Replacement Report</h2>
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
          <p>{result.error || 'Failed to load report data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <SparePartsReport
      rows={result.data.rows}
      requestRows={result.data.requestRows}
      totals={result.data.totals}
      generatedAt={new Date()}
    />
  );
}
