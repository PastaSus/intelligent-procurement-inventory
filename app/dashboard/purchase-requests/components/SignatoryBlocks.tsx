'use client';

export type SignatoryKey = 'prepared' | 'checked' | 'recommended' | 'approved';

export const SIGNATORIES: { key: SignatoryKey; role: string; signer: string }[] = [
  { key: 'prepared', role: 'Prepared by', signer: 'SA' },
  { key: 'checked', role: 'Checked by', signer: 'Technician' },
  { key: 'recommended', role: 'Recommended by', signer: 'Lab Admin' },
  { key: 'approved', role: 'Approved by', signer: 'Dean' },
];

export function SignatoryBlocks() {
  return (
    <div className="signature-blocks flex flex-wrap justify-between gap-6">
      {SIGNATORIES.map(({ key, role, signer }) => (
        <div key={key} className="flex-1 min-w-[120px] max-w-[200px] text-center">
          <div className="font-semibold">{role}</div>
          <div className="h-16" aria-hidden="true" />
          <div className="border-t border-black pt-1 font-semibold min-h-[1.5rem] break-words">
            {signer}
          </div>
          <p className="text-xs mt-1">Signature over Printed Name</p>
          <p className="text-xs mt-3 text-left">Date: ______________</p>
        </div>
      ))}
    </div>
  );
}
