import { LocationType } from '../location.entity';

export interface LocationSeed {
  code: string;
  name: string;
  nameWolof?: string;
  type: LocationType;
  region: string;
  department?: string;
  parentCode?: string;
  latitude: number;
  longitude: number;
  aliases?: string;
}

export const SENEGAL_LOCATIONS: LocationSeed[] = [
  // ═══════════ RÉGIONS ═══════════
  { code: 'RG-DK', name: 'Dakar', nameWolof: 'Ndakaaru', type: LocationType.REGION, region: 'Dakar', latitude: 14.7167, longitude: -17.4677 },
  { code: 'RG-TH', name: 'Thiès', nameWolof: 'Cees', type: LocationType.REGION, region: 'Thiès', latitude: 14.7889, longitude: -16.9261 },
  { code: 'RG-SL', name: 'Saint-Louis', nameWolof: 'Ndar', type: LocationType.REGION, region: 'Saint-Louis', latitude: 16.0326, longitude: -16.4897 },
  { code: 'RG-DL', name: 'Diourbel', nameWolof: 'Jurbel', type: LocationType.REGION, region: 'Diourbel', latitude: 14.6556, longitude: -16.2314 },
  { code: 'RG-FT', name: 'Fatick', type: LocationType.REGION, region: 'Fatick', latitude: 14.3344, longitude: -16.4114 },
  { code: 'RG-KL', name: 'Kaolack', type: LocationType.REGION, region: 'Kaolack', latitude: 14.1652, longitude: -16.0758 },
  { code: 'RG-KF', name: 'Kaffrine', type: LocationType.REGION, region: 'Kaffrine', latitude: 14.1058, longitude: -15.5508 },
  { code: 'RG-MT', name: 'Matam', type: LocationType.REGION, region: 'Matam', latitude: 15.6558, longitude: -13.2558 },
  { code: 'RG-TM', name: 'Tambacounda', type: LocationType.REGION, region: 'Tambacounda', latitude: 13.7708, longitude: -13.6673 },
  { code: 'RG-KD', name: 'Kédougou', type: LocationType.REGION, region: 'Kédougou', latitude: 12.5579, longitude: -12.1742 },
  { code: 'RG-KG', name: 'Kolda', type: LocationType.REGION, region: 'Kolda', latitude: 12.8958, longitude: -14.9508 },
  { code: 'RG-SE', name: 'Sédhiou', type: LocationType.REGION, region: 'Sédhiou', latitude: 12.7081, longitude: -15.5569 },
  { code: 'RG-ZG', name: 'Ziguinchor', nameWolof: 'Siggcoor', type: LocationType.REGION, region: 'Ziguinchor', latitude: 12.5833, longitude: -16.2719 },
  { code: 'RG-LG', name: 'Louga', nameWolof: 'Luga', type: LocationType.REGION, region: 'Louga', latitude: 15.6144, longitude: -16.2286 },

  // ═══════════ DAKAR — Villes & Quartiers ═══════════
  { code: 'DK-PL', name: 'Plateau', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.6708, longitude: -17.4381, aliases: 'plateau centre' },
  { code: 'DK-MD', name: 'Médina', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.6842, longitude: -17.4500 },
  { code: 'DK-FN', name: 'Fann', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.6911, longitude: -17.4644 },
  { code: 'DK-PT', name: 'Point E', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.6967, longitude: -17.4611 },
  { code: 'DK-MB', name: 'Mermoz', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7086, longitude: -17.4758 },
  { code: 'DK-SC', name: 'Sacré-Cœur', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7181, longitude: -17.4703 },
  { code: 'DK-OK', name: 'Ouakam', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7186, longitude: -17.4898 },
  { code: 'DK-NG', name: 'Ngor', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7519, longitude: -17.5114 },
  { code: 'DK-AL', name: 'Almadies', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7406, longitude: -17.5158 },
  { code: 'DK-YF', name: 'Yoff', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7528, longitude: -17.4781 },
  { code: 'DK-GR', name: 'Grand Yoff', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7319, longitude: -17.4575, aliases: 'grand yoff' },
  { code: 'DK-PC', name: 'Parcelles Assainies', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7642, longitude: -17.4300, aliases: 'parcelles' },
  { code: 'DK-PT2', name: 'Patte d\'Oie', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7439, longitude: -17.4472, aliases: 'patte doie' },
  { code: 'DK-CM', name: 'Cambérène', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7583, longitude: -17.4269 },
  { code: 'DK-HM', name: 'Hann Maristes', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7186, longitude: -17.4281 },
  { code: 'DK-HB', name: 'Hann Bel-Air', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7225, longitude: -17.4214 },

  // ═══════════ PIKINE — Quartiers ═══════════
  { code: 'PK-PK', name: 'Pikine', nameWolof: 'Pikin', type: LocationType.CITY, region: 'Dakar', department: 'Pikine', parentCode: 'RG-DK', latitude: 14.7645, longitude: -17.3907 },
  { code: 'PK-GD', name: 'Guédiawaye', type: LocationType.CITY, region: 'Dakar', department: 'Guédiawaye', parentCode: 'RG-DK', latitude: 14.7761, longitude: -17.4061 },
  { code: 'PK-TH', name: 'Thiaroye', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'PK-PK', latitude: 14.7447, longitude: -17.3533 },
  { code: 'PK-YB', name: 'Yeumbeul', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'PK-PK', latitude: 14.7740, longitude: -17.3450 },
  { code: 'PK-KM', name: 'Keur Massar', type: LocationType.CITY, region: 'Dakar', department: 'Keur Massar', parentCode: 'RG-DK', latitude: 14.7789, longitude: -17.3157 },
  { code: 'PK-MB', name: 'Malika', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'PK-PK', latitude: 14.7883, longitude: -17.3269 },
  { code: 'PK-DN', name: 'Diamniadio', type: LocationType.CITY, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7306, longitude: -17.1836 },
  { code: 'PK-RF', name: 'Rufisque', type: LocationType.CITY, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7158, longitude: -17.2731 },
  { code: 'PK-BM', name: 'Bargny', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'PK-RF', latitude: 14.6953, longitude: -17.2244 },
  { code: 'PK-SE', name: 'Sébikotane', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7422, longitude: -17.1461 },
  { code: 'PK-SN', name: 'Sangalkam', type: LocationType.QUARTER, region: 'Dakar', parentCode: 'RG-DK', latitude: 14.7772, longitude: -17.2189 },

  // ═══════════ THIÈS ═══════════
  { code: 'TH-TH', name: 'Thiès', nameWolof: 'Cees', type: LocationType.CITY, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.7888, longitude: -16.9269 },
  { code: 'TH-MB', name: 'Mbour', type: LocationType.CITY, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.4194, longitude: -16.9642 },
  { code: 'TH-TB', name: 'Tivaouane', type: LocationType.CITY, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.9522, longitude: -16.8178 },
  { code: 'TH-KM', name: 'Khombole', type: LocationType.QUARTER, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.7667, longitude: -16.7000 },
  { code: 'TH-PO', name: 'Pout', type: LocationType.QUARTER, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.7697, longitude: -17.0606 },
  { code: 'TH-JF', name: 'Joal-Fadiouth', type: LocationType.CITY, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.1667, longitude: -16.8333 },
  { code: 'TH-SL', name: 'Saly Portudal', type: LocationType.CITY, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.4386, longitude: -17.0083 },
  { code: 'TH-PP', name: 'Popenguine', type: LocationType.CITY, region: 'Thiès', parentCode: 'RG-TH', latitude: 14.5522, longitude: -17.1156 },

  // ═══════════ SAINT-LOUIS ═══════════
  { code: 'SL-SL', name: 'Saint-Louis', nameWolof: 'Ndar', type: LocationType.CITY, region: 'Saint-Louis', parentCode: 'RG-SL', latitude: 16.0326, longitude: -16.4897 },
  { code: 'SL-RB', name: 'Richard-Toll', type: LocationType.CITY, region: 'Saint-Louis', parentCode: 'RG-SL', latitude: 16.4625, longitude: -15.7006 },
  { code: 'SL-DG', name: 'Dagana', type: LocationType.QUARTER, region: 'Saint-Louis', parentCode: 'RG-SL', latitude: 16.5264, longitude: -15.5056 },
  { code: 'SL-PD', name: 'Podor', type: LocationType.CITY, region: 'Saint-Louis', parentCode: 'RG-SL', latitude: 16.6492, longitude: -14.9539 },

  // ═══════════ LOUGA ═══════════
  { code: 'LG-LG', name: 'Louga', nameWolof: 'Luga', type: LocationType.CITY, region: 'Louga', parentCode: 'RG-LG', latitude: 15.6144, longitude: -16.2286 },
  { code: 'LG-KB', name: 'Kébémer', type: LocationType.QUARTER, region: 'Louga', parentCode: 'RG-LG', latitude: 15.3667, longitude: -16.4500 },
  { code: 'LG-LG2', name: 'Linguère', type: LocationType.QUARTER, region: 'Louga', parentCode: 'RG-LG', latitude: 15.4000, longitude: -15.3167 },

  // ═══════════ DIOURBEL ═══════════
  { code: 'DL-DL', name: 'Diourbel', type: LocationType.CITY, region: 'Diourbel', parentCode: 'RG-DL', latitude: 14.6556, longitude: -16.2314 },
  { code: 'DL-TB', name: 'Touba', nameWolof: 'Tuubaa', type: LocationType.CITY, region: 'Diourbel', parentCode: 'RG-DL', latitude: 14.8500, longitude: -15.8833 },
  { code: 'DL-MB', name: 'Mbacké', type: LocationType.CITY, region: 'Diourbel', parentCode: 'RG-DL', latitude: 14.7900, longitude: -15.9081 },
  { code: 'DL-BK', name: 'Bambey', type: LocationType.QUARTER, region: 'Diourbel', parentCode: 'RG-DL', latitude: 14.7000, longitude: -16.4500 },

  // ═══════════ FATICK ═══════════
  { code: 'FT-FT', name: 'Fatick', type: LocationType.CITY, region: 'Fatick', parentCode: 'RG-FT', latitude: 14.3344, longitude: -16.4114 },
  { code: 'FT-KF', name: 'Kaolack-Fatick', type: LocationType.QUARTER, region: 'Fatick', parentCode: 'RG-FT', latitude: 14.2000, longitude: -16.5000 },
  { code: 'FT-FD', name: 'Foundiougne', type: LocationType.QUARTER, region: 'Fatick', parentCode: 'RG-FT', latitude: 14.1333, longitude: -16.4667 },
  { code: 'FT-GG', name: 'Gossas', type: LocationType.QUARTER, region: 'Fatick', parentCode: 'RG-FT', latitude: 14.5000, longitude: -16.0500 },

  // ═══════════ KAOLACK ═══════════
  { code: 'KL-KL', name: 'Kaolack', type: LocationType.CITY, region: 'Kaolack', parentCode: 'RG-KL', latitude: 14.1652, longitude: -16.0758 },
  { code: 'KL-KF', name: 'Kaffrine-Kaolack', type: LocationType.QUARTER, region: 'Kaolack', parentCode: 'RG-KL', latitude: 14.0000, longitude: -15.5500 },
  { code: 'KL-NR', name: 'Nioro du Rip', type: LocationType.CITY, region: 'Kaolack', parentCode: 'RG-KL', latitude: 13.7500, longitude: -15.8000 },

  // ═══════════ KAFFRINE ═══════════
  { code: 'KF-KF', name: 'Kaffrine', type: LocationType.CITY, region: 'Kaffrine', parentCode: 'RG-KF', latitude: 14.1058, longitude: -15.5508 },
  { code: 'KF-BK', name: 'Birkelane', type: LocationType.QUARTER, region: 'Kaffrine', parentCode: 'RG-KF', latitude: 14.1667, longitude: -15.7500 },
  { code: 'KF-KG', name: 'Koungheul', type: LocationType.QUARTER, region: 'Kaffrine', parentCode: 'RG-KF', latitude: 13.9833, longitude: -14.8000 },

  // ═══════════ MATAM ═══════════
  { code: 'MT-MT', name: 'Matam', type: LocationType.CITY, region: 'Matam', parentCode: 'RG-MT', latitude: 15.6558, longitude: -13.2558 },
  { code: 'MT-BK', name: 'Bakel', type: LocationType.QUARTER, region: 'Matam', parentCode: 'RG-MT', latitude: 14.9000, longitude: -12.4667 },
  { code: 'MT-KD', name: 'Kanel', type: LocationType.QUARTER, region: 'Matam', parentCode: 'RG-MT', latitude: 15.4833, longitude: -13.1667 },

  // ═══════════ TAMBACOUNDA ═══════════
  { code: 'TM-TM', name: 'Tambacounda', type: LocationType.CITY, region: 'Tambacounda', parentCode: 'RG-TM', latitude: 13.7708, longitude: -13.6673 },
  { code: 'TM-BF', name: 'Bakel-Tambacounda', type: LocationType.QUARTER, region: 'Tambacounda', parentCode: 'RG-TM', latitude: 14.0000, longitude: -12.0000 },
  { code: 'TM-GD', name: 'Goudiry', type: LocationType.QUARTER, region: 'Tambacounda', parentCode: 'RG-TM', latitude: 14.0333, longitude: -12.8000 },

  // ═══════════ KÉDOUGOU ═══════════
  { code: 'KD-KD', name: 'Kédougou', type: LocationType.CITY, region: 'Kédougou', parentCode: 'RG-KD', latitude: 12.5579, longitude: -12.1742 },
  { code: 'KD-SL', name: 'Salémata', type: LocationType.QUARTER, region: 'Kédougou', parentCode: 'RG-KD', latitude: 12.6333, longitude: -12.8167 },
  { code: 'KD-SR', name: 'Saraya', type: LocationType.QUARTER, region: 'Kédougou', parentCode: 'RG-KD', latitude: 12.8333, longitude: -11.7500 },

  // ═══════════ KOLDA ═══════════
  { code: 'KG-KG', name: 'Kolda', type: LocationType.CITY, region: 'Kolda', parentCode: 'RG-KG', latitude: 12.8958, longitude: -14.9508 },
  { code: 'KG-VF', name: 'Vélingara', type: LocationType.CITY, region: 'Kolda', parentCode: 'RG-KG', latitude: 13.1500, longitude: -14.1000 },
  { code: 'KG-MD', name: 'Médina Yoro Foulah', type: LocationType.QUARTER, region: 'Kolda', parentCode: 'RG-KG', latitude: 13.3000, longitude: -14.4500 },

  // ═══════════ SÉDHIOU ═══════════
  { code: 'SE-SE', name: 'Sédhiou', type: LocationType.CITY, region: 'Sédhiou', parentCode: 'RG-SE', latitude: 12.7081, longitude: -15.5569 },
  { code: 'SE-BK', name: 'Bounkiling', type: LocationType.QUARTER, region: 'Sédhiou', parentCode: 'RG-SE', latitude: 13.0500, longitude: -15.7000 },
  { code: 'SE-GD', name: 'Goudomp', type: LocationType.QUARTER, region: 'Sédhiou', parentCode: 'RG-SE', latitude: 12.5833, longitude: -15.8333 },

  // ═══════════ ZIGUINCHOR ═══════════
  { code: 'ZG-ZG', name: 'Ziguinchor', nameWolof: 'Siggcoor', type: LocationType.CITY, region: 'Ziguinchor', parentCode: 'RG-ZG', latitude: 12.5833, longitude: -16.2719 },
  { code: 'ZG-BG', name: 'Bignona', type: LocationType.CITY, region: 'Ziguinchor', parentCode: 'RG-ZG', latitude: 12.8167, longitude: -16.2333 },
  { code: 'ZG-OS', name: 'Oussouye', type: LocationType.CITY, region: 'Ziguinchor', parentCode: 'RG-ZG', latitude: 12.4833, longitude: -16.5500 },
  { code: 'ZG-CP', name: 'Cap Skirring', type: LocationType.CITY, region: 'Ziguinchor', parentCode: 'RG-ZG', latitude: 12.3833, longitude: -16.7500 },
];
