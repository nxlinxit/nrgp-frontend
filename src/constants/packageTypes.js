export const PKG_TYPES = [
  { code: 'BIN-001', label: 'Bin' },
  { code: 'PAL-001', label: 'Pallet' },
  { code: 'STP-001', label: 'Steel pallet' },
  { code: 'TRO-001', label: 'Trolley' },
  { code: 'CB-001', label: 'Carton box' },
  { code: 'OTH-001', label: 'Others', hasDescription: true }
];

export const getPackageLabel = (code) => PKG_TYPES.find((p) => p.code === code)?.label || code;
