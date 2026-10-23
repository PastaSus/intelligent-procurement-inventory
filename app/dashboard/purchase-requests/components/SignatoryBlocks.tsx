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
    <div className="signature-blocks grid grid-cols-4 gap-6">
      {SIGNATORIES.map(({ key, role, signer, name }) => (
        <div key={key} className="w-full text-center">
          <div className="text-sm font-semibold">{role}</div>
          <div className="h-12" aria-hidden="true" />
          <div className="border-t border-black pt-1 min-h-[1.25rem] break-words">
            {name ? (
              <>
                <div className="text-sm font-semibold leading-tight">{name}</div>
                <div className="text-[10px]">{signer}</div>
              </>
            ) : (
              <div className="text-sm font-semibold">{signer}</div>
            )}
          </div>
          <p className="text-[10px] mt-1">Signature over Printed Name</p>
          <p className="text-[10px] mt-2">Date: ____________</p>
        </div>
      ))}
    </div>
  );
}
