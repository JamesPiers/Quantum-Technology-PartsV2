export interface SubCatalog {
  code: string;
  name: string;
  description?: string;
}

export interface PartCatalog {
  name: string;
  code: string;
  subCatalogs: SubCatalog[];
  details: string[]; // List of attribute names required for this catalog
}

export const PART_CATALOGS: PartCatalog[] = [
  {
    name: 'Compressors + Coldheads',
    code: 'COMP',
    subCatalogs: [
      { code: 'HR3', name: 'Labscale HR3, He Gas' },
      { code: 'HP', name: 'High pressure, gas bag systems' },
      { code: 'CHCP', name: 'Coldhead Compressor' },
      { code: 'CH', name: 'Coldhead' },
      { code: 'CHP', name: 'Coldhead parts' },
      { code: 'DP', name: 'Diaphragm pump, labscale' },
      { code: 'IND', name: 'Industrial projects' },
    ],
    details: ['Voltage', 'Phase', 'Max Operating Pressure', 'Flowrate', 'Process Media', 'Installation Location', 'UL/CE', 'SM10/SM13'],
  },
  {
    name: 'Dewars',
    code: 'DEW',
    subCatalogs: [
      { code: 'CD', name: 'Cryodiffusion Dewar' },
      { code: 'CF', name: 'Cryofab dewar' },
    ],
    details: ['Type', 'Net Volume', 'Internal Diameter', 'Media', 'Features'],
  },
  {
    name: 'Top Plates',
    code: 'TP',
    subCatalogs: [
      { code: '20LPD', name: '20LPD' },
      { code: '40LPD', name: '40LPD' },
      { code: '60LPD', name: '60LPD' },
      { code: 'CFP', name: 'Cryofree Purifier' },
    ],
    details: ['Dewar ID', 'Media', 'Dewar Net Volume', 'Revision Number'],
  },
  {
    name: 'Media Lines',
    code: 'LINE',
    subCatalogs: [
      { code: 'IC', name: 'Interconnecting Line' },
      { code: 'PL', name: 'Purifier flex line' },
      { code: 'CUST', name: 'Custom lines' },
    ],
    details: ['Diameter', 'Length', 'End Connections', 'Pressure Rating', 'Braided/Unbraided', 'Flexpression'],
  },
  {
    name: 'Transfer Lines',
    code: 'XLINE',
    subCatalogs: [
      { code: 'CDX', name: 'Cryodiffusion Transfer Line' },
      { code: 'CFX', name: 'Cryofab Transfer line' },
    ],
    details: ['Operation', 'Length', 'End Connections', 'Braided/Unbraided'],
  },
  {
    name: 'Gas Bag',
    code: 'GB',
    subCatalogs: [
      { code: 'Pxxx', name: 'Custom gas bag per project' },
    ],
    details: ['Volume', 'Material', 'Dimensions', 'ASME Rating'],
  },
  {
    name: 'Cylinders',
    code: 'CYL',
    subCatalogs: [
      { code: 'MPTank', name: 'MP storage Tank' },
      { code: 'BUF', name: 'Buffer Tank' },
      { code: 'HPCyl', name: 'High Pressure cylinder' },
      { code: 'DD', name: 'Dessicant Dryer' },
      { code: 'CryTank', name: 'Cryogenic Tank' },
    ],
    details: [],
  },
  {
    name: 'Filters',
    code: 'FILT',
    subCatalogs: [
      { code: 'FH', name: 'Filter Housing' },
      { code: 'FC', name: 'Filter Cartridge' },
    ],
    details: ['Pressure Rating', 'Flow Rate', 'Material', 'Connection Size', 'Micron Size'],
  },
  {
    name: 'Measurement Equipment',
    code: 'MEAS',
    subCatalogs: [
      { code: 'BGA', name: 'Binary Gas Analyzer' },
      { code: 'DIOD', name: 'Cryogenic Temperature Diodes' },
      { code: 'ANAL', name: 'Gas or Media analyzers' },
      { code: 'DPT', name: 'Differential Pressure transmitters' },
      { code: 'PT', name: 'Pressure Transmitter' },
    ],
    details: [],
  },
  {
    name: 'Heat Exchanger',
    code: 'HX',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Chiller',
    code: 'CHILL',
    subCatalogs: [],
    details: ['Flowrate', 'KWh', 'Operating Pressure', 'Electrical Input'],
  },
  {
    name: 'Fittings',
    code: 'FT',
    subCatalogs: [
      { code: 'NPT', name: 'NPT' },
      { code: 'KF', name: 'KF' },
      { code: 'BSPP', name: 'BSPP' },
      { code: 'BSPT', name: 'BSPT' },
      { code: 'TC', name: 'Tri-clamp' },
      { code: 'RF', name: 'Raised face flange' },
      { code: 'FF', name: 'Flat faced flange' },
      { code: 'xx-yy', name: 'Convertor' },
      { code: 'TF', name: 'Tube Fitting' },
    ],
    details: ['Inlet', 'Outlet', 'Material', 'Pressure Rating'],
  },
  {
    name: 'Process Valves',
    code: 'VAL',
    subCatalogs: [
      { code: 'BV', name: 'Ball valve' },
      { code: 'NV', name: 'Needle Valve' },
      { code: 'BFV', name: 'Butterfly Valve' },
      { code: 'GV', name: 'Globe Valve' },
      { code: 'SOL', name: 'Solenoid Valve' },
      { code: 'ACT-XX', name: 'Actuated valve' },
      { code: 'VAC', name: 'Vacuum operator' },
      { code: 'TWB', name: 'Three way ball valve' },
    ],
    details: ['Inlet', 'Outlet', 'Material', 'Pressure Rating', 'Seat Material', 'Flowrate', 'ASME/CE Rating', 'Electronic Connections/Actuator', 'End Connections'],
  },
  {
    name: 'Control Valve',
    code: 'CTRLVAL',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Relief Valves',
    code: 'RF',
    subCatalogs: [
      { code: 'xx', name: 'Standard relief valve' },
      { code: 'CV', name: 'Check valve' },
      { code: 'BD', name: 'Burst Disc' },
    ],
    details: [],
  },
  {
    name: 'Regulators',
    code: 'REG',
    subCatalogs: [
      { code: 'FP', name: 'Forward pressure regulator' },
      { code: 'BP', name: 'Back pressure regulator' },
      { code: 'xx', name: 'Regulator designation' },
      { code: 'RO', name: 'Restricting orifice' },
    ],
    details: [],
  },
  {
    name: 'Flow Meters',
    code: 'FM',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Pressure Gauge',
    code: 'PI',
    subCatalogs: [],
    details: ['Type', 'Pressure Range', 'Material Internals', 'Connection Size', 'Glycol Filled'],
  },
  {
    name: 'Temperature Gauge',
    code: 'TI',
    subCatalogs: [],
    details: ['Type', 'Temperature Range'],
  },
  {
    name: 'Hardware',
    code: 'HW',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Materials',
    code: 'MAT',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Sub Contractor',
    code: 'S/C',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Name Plate',
    code: 'NP',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Miscellaneous',
    code: 'MISC',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Quotations',
    code: 'QUOT',
    subCatalogs: [],
    details: [],
  },
  {
    name: 'Electronics',
    code: 'ELEC',
    subCatalogs: [],
    details: [],
  },
];

