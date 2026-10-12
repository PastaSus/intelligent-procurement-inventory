'use client';

export type SignatoryKey = 'prepared' | 'checked' | 'approved' | 'noted' | 'technician';

export const SIGNATORIES: { key: SignatoryKey; role: string }[] = [
  { key: 'prepared', role: 'Prepared by' },
  { key: 'checked', role: 'Checked by' },
  { key: 'approved', role: 'Approved by' },
  { key: 'noted', role: 'Noted by' },
  { key: 'technician', role: 'Technician' },
];

export const DEFAULT_SIGNATORY_NAMES: Record<SignatoryKey, string> = {
  prepared: '',
  checked: '',
  approved: '',
  noted: 'Diosdado C. Caronongan',
  technician: '',
};

interface SignatoryBlocksProps {
  names: Record<SignatoryKey, string>;
  editable?: boolean;
  onNamesChange?: (key: SignatoryKey, value: string) => void;
}

export function SignatoryBlocks({ names, editable = false, onNamesChange }: SignatoryBlocksProps) {
  function renderBlock(key: SignatoryKey, role: string) {
    return (
      <div key={key} className="flex-1 min-w-[120px] max-w-[220px] text-center">
        <div className="font-semibold">{role}</div>
        <div className="h-12" aria-hidden="true" />
        {editable ? (
          <input
            aria-label={`${role} name`}
            placeholder="Type name..."
            value={names[key] ?? ''}
            onChange={(e) => onNamesChange?.(key, e.target.value)}
            className="w-full border-t border-black pt-1 font-semibold text-center bg-transparent outline-none placeholder:font-normal placeholder:text-gray-400"
          />
        ) : (
          <div className="border-t border-black pt-1 font-semibold min-h-[1.5rem] break-words">
            {names[key].trim() || ' '}
          </div>
        )}
        <p className="text-xs mt-1">Signature over printed name</p>
        <p className="text-xs mt-3 text-left">Date: ______________</p>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="signature-blocks flex flex-wrap justify-between gap-6 mt-14">
        {SIGNATORIES.slice(0, 3).map(({ key, role }) => renderBlock(key, role))}
      </div>
      <div className="signature-blocks flex flex-wrap justify-between gap-6 mt-16">
        {SIGNATORIES.slice(3).map(({ key, role }) => renderBlock(key, role))}
      </div>
    </div>
  );
}
