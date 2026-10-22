'use client';

export type SignatoryKey = 'prepared' | 'checked' | 'recommended' | 'approved';

export const SIGNATORIES: { key: SignatoryKey; role: string; signer: string; name?: string }[] = [
  { key: 'prepared', role: 'Prepared by', signer: 'SA' },
  { key: 'checked', role: 'Checked by', signer: 'Technician' },
  { key: 'recommended', role: 'Recommended by', signer: 'Lab Admin' },
  { key: 'approved', role: 'Approved by', signer: 'Dean', name: 'Diosdado C. Caronongan' },
];

export function SignatoryBlocks() {
  return (
    <div className="signature-blocks grid grid-cols-2 gap-x-12 gap-y-8">
      {SIGNATORIES.map(({ key, role, signer, name }) => (
        <div key={key} className="w-full text-center">
          <div className="font-semibold">{role}</div>
          <div className="h-16" aria-hidden="true" />
          <div className="border-t border-black pt-1 min-h-[1.5rem] break-words">
            {name ? (
              <div className="font-semibold">{name}</div>
            ) : (
              <div className="font-semibold">{signer}</div>
            )}
          </div>
          <p className="text-xs mt-1">Signature over Printed Name</p>
          <p className="text-xs mt-3 text-left">Date: ______________</p>
        </div>
      ))}
    </div>
  );
}
