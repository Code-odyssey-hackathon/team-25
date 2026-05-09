/**
 * K-GRM — Karnataka District Master Data
 * 
 * All 31 districts of Karnataka with municipal corporation info,
 * DC office references, and geo coordinates for map centering.
 * Reference: https://dma.karnataka.gov.in/english
 */

export const KARNATAKA_DISTRICTS = [
  { code: 'BLR', name: 'Bengaluru Urban', hasCorporation: true, corporationName: 'Bruhat Bengaluru Mahanagara Palike (BBMP)', corporationUrl: 'https://bbmp.gov.in/', lat: 12.9716, lng: 77.5946, dcPortal: 'https://bangaloreurban.nic.in/' },
  { code: 'BLR_R', name: 'Bengaluru Rural', hasCorporation: false, lat: 13.2257, lng: 77.5457, dcPortal: 'https://bangalorerural.nic.in/' },
  { code: 'BGM', name: 'Belagavi', hasCorporation: true, corporationName: 'Belagavi City Corporation', corporationUrl: 'https://belagavi.nic.in/en/muncipaly/', lat: 15.8497, lng: 74.4977, dcPortal: 'https://belagavi.nic.in/' },
  { code: 'BLY', name: 'Ballari', hasCorporation: true, corporationName: 'Ballari City Corporation', corporationUrl: 'https://ballari.nic.in/', lat: 15.1394, lng: 76.9214, dcPortal: 'https://ballari.nic.in/' },
  { code: 'BGR', name: 'Bagalkot', hasCorporation: false, lat: 16.1691, lng: 75.6615, dcPortal: 'https://bagalkot.nic.in/' },
  { code: 'BDR', name: 'Bidar', hasCorporation: false, lat: 17.9104, lng: 77.5199, dcPortal: 'https://bidar.nic.in/' },
  { code: 'CKM', name: 'Chamarajanagar', hasCorporation: false, lat: 11.9236, lng: 76.9398, dcPortal: 'https://chamarajanagar.nic.in/' },
  { code: 'CKB', name: 'Chikkaballapur', hasCorporation: false, lat: 13.4355, lng: 77.7315, dcPortal: 'https://chikballapur.nic.in/' },
  { code: 'CKM_G', name: 'Chikkamagaluru', hasCorporation: false, lat: 13.3161, lng: 75.7720, dcPortal: 'https://chikmagalur.nic.in/' },
  { code: 'CTG', name: 'Chitradurga', hasCorporation: false, lat: 14.2251, lng: 76.3980, dcPortal: 'https://chitradurga.nic.in/' },
  { code: 'DKN', name: 'Dakshina Kannada', hasCorporation: true, corporationName: 'Mangaluru City Corporation', corporationUrl: 'https://mangalorencitycorporation.gov.in/', lat: 12.8438, lng: 74.8585, dcPortal: 'https://dakshinakannada.nic.in/' },
  { code: 'DVG', name: 'Davanagere', hasCorporation: true, corporationName: 'Davanagere City Corporation', corporationUrl: 'https://davanagere.nic.in/', lat: 14.4644, lng: 75.9218, dcPortal: 'https://davanagere.nic.in/' },
  { code: 'DWD', name: 'Dharwad', hasCorporation: true, corporationName: 'Hubballi-Dharwad City Corporation (HDMC)', corporationUrl: 'https://hubballidharwad.gov.in/', lat: 15.4589, lng: 75.0078, dcPortal: 'https://dharwad.nic.in/' },
  { code: 'GDG', name: 'Gadag', hasCorporation: false, lat: 15.4166, lng: 75.6269, dcPortal: 'https://gadag.nic.in/' },
  { code: 'KLB', name: 'Kalaburagi', hasCorporation: true, corporationName: 'Kalaburagi City Corporation', corporationUrl: 'https://kalaburagi.nic.in/', lat: 17.3297, lng: 76.8343, dcPortal: 'https://kalaburagi.nic.in/' },
  { code: 'HSN', name: 'Hassan', hasCorporation: false, lat: 13.0069, lng: 76.1004, dcPortal: 'https://hassan.nic.in/' },
  { code: 'HVR', name: 'Haveri', hasCorporation: false, lat: 14.7951, lng: 75.4006, dcPortal: 'https://haveri.nic.in/' },
  { code: 'KDP', name: 'Kolar', hasCorporation: false, lat: 13.1360, lng: 78.1292, dcPortal: 'https://kolar.nic.in/' },
  { code: 'KPL', name: 'Koppal', hasCorporation: false, lat: 15.3547, lng: 76.1534, dcPortal: 'https://koppal.nic.in/' },
  { code: 'KDG', name: 'Kodagu', hasCorporation: false, lat: 12.4244, lng: 75.7382, dcPortal: 'https://kodagu.nic.in/' },
  { code: 'MND', name: 'Mandya', hasCorporation: false, lat: 12.5218, lng: 76.8951, dcPortal: 'https://mandya.nic.in/' },
  { code: 'MYS', name: 'Mysuru', hasCorporation: true, corporationName: 'Mysuru City Corporation', corporationUrl: 'https://www.mysurucitycorporation.com/', lat: 12.2958, lng: 76.6394, dcPortal: 'https://mysore.nic.in/' },
  { code: 'RCR', name: 'Raichur', hasCorporation: false, lat: 16.2120, lng: 77.3439, dcPortal: 'https://raichur.nic.in/' },
  { code: 'RMN', name: 'Ramanagara', hasCorporation: false, lat: 12.7159, lng: 77.2808, dcPortal: 'https://ramanagara.nic.in/' },
  { code: 'SMG', name: 'Shivamogga', hasCorporation: true, corporationName: 'Shivamogga City Corporation', corporationUrl: 'https://shivamogga.nic.in/', lat: 13.9299, lng: 75.5681, dcPortal: 'https://shimoga.nic.in/' },
  { code: 'TMK', name: 'Tumakuru', hasCorporation: true, corporationName: 'Tumakuru City Corporation', corporationUrl: 'https://tumkur.nic.in/', lat: 13.3379, lng: 77.1173, dcPortal: 'https://tumkur.nic.in/' },
  { code: 'UDP', name: 'Udupi', hasCorporation: false, lat: 13.3409, lng: 74.7421, dcPortal: 'https://udupi.nic.in/' },
  { code: 'UKN', name: 'Uttara Kannada', hasCorporation: false, lat: 14.7937, lng: 74.5886, dcPortal: 'https://uttarakannada.nic.in/' },
  { code: 'VJP', name: 'Vijayapura', hasCorporation: false, lat: 16.8302, lng: 75.7100, dcPortal: 'https://vijayapura.nic.in/' },
  { code: 'YDG', name: 'Yadgir', hasCorporation: false, lat: 16.7604, lng: 77.1300, dcPortal: 'https://yadgir.nic.in/' },
  { code: 'YDR', name: 'Vijayanagara', hasCorporation: false, lat: 15.3350, lng: 76.4600, dcPortal: 'https://vijayanagara.nic.in/' },
];

/**
 * Get district by code
 */
export function getDistrictByCode(code) {
  return KARNATAKA_DISTRICTS.find(d => d.code === code) || null;
}

/**
 * Get district by name (case-insensitive partial match)
 */
export function getDistrictByName(name) {
  const lower = name.toLowerCase();
  return KARNATAKA_DISTRICTS.find(d => d.name.toLowerCase().includes(lower)) || null;
}

/**
 * Get all municipal corporations
 */
export function getMunicipalCorporations() {
  return KARNATAKA_DISTRICTS.filter(d => d.hasCorporation);
}

/**
 * Get district names for dropdown
 */
export function getDistrictNames() {
  return KARNATAKA_DISTRICTS.map(d => d.name).sort();
}

/**
 * Get district codes for dropdown
 */
export function getDistrictOptions() {
  return KARNATAKA_DISTRICTS
    .map(d => ({ value: d.code, label: d.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
