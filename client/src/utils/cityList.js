export const CITY_LIST = [
  'Ahmedabad', 'Agra', 'Amritsar', 'Aurangabad', 'Bangalore', 'Bengaluru', 'Bhopal', 'Chandigarh', 'Chennai',
  'Coimbatore', 'Delhi', 'Erode', 'Guntur', 'Howrah', 'Hubli', 'Hyderabad', 'Indore', 'Jaipur', 'Jodhpur',
  'Kanpur', 'Kochi', 'Kolkata', 'Kozhikode', 'Lucknow', 'Ludhiana', 'Madurai', 'Mangalore', 'Mumbai', 'Mysore',
  'Nagpur', 'Nashik', 'New Delhi', 'Pune', 'Rajkot', 'Salem', 'Surat', 'Tambaram', 'Thane', 'Thiruvananthapuram',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Vadodara', 'Varanasi', 'Vellore', 'Vijayawada', 'Visakhapatnam',
];

export const MUNICIPAL_CITY_MAP = {
  chennai: { name: 'Greater Chennai Corporation', state: 'Tamil Nadu' },
  coimbatore: { name: 'Coimbatore City Municipal Corporation', state: 'Tamil Nadu' },
  madurai: { name: 'Madurai City Municipal Corporation', state: 'Tamil Nadu' },
  tambaram: { name: 'Tambaram Municipal Corporation', state: 'Tamil Nadu' },
  tiruchirappalli: { name: 'Tiruchirappalli City Municipal Corporation', state: 'Tamil Nadu' },
  salem: { name: 'Salem City Municipal Corporation', state: 'Tamil Nadu' },
  tirunelveli: { name: 'Tirunelveli City Municipal Corporation', state: 'Tamil Nadu' },
  vellore: { name: 'Vellore City Municipal Corporation', state: 'Tamil Nadu' },
  erode: { name: 'Erode City Municipal Corporation', state: 'Tamil Nadu' },
  thoothukudi: { name: 'Thoothukudi Municipal Corporation', state: 'Tamil Nadu' },
  mumbai: { name: 'Brihanmumbai Municipal Corporation', state: 'Maharashtra' },
  pune: { name: 'Pune Municipal Corporation', state: 'Maharashtra' },
  nagpur: { name: 'Nagpur Municipal Corporation', state: 'Maharashtra' },
  nashik: { name: 'Nashik Municipal Corporation', state: 'Maharashtra' },
  thane: { name: 'Thane Municipal Corporation', state: 'Maharashtra' },
  aurangabad: { name: 'Aurangabad Municipal Corporation', state: 'Maharashtra' },
  bangalore: { name: 'Bruhat Bengaluru Mahanagara Palike', state: 'Karnataka' },
  bengaluru: { name: 'Bruhat Bengaluru Mahanagara Palike', state: 'Karnataka' },
  mysore: { name: 'Mysuru City Corporation', state: 'Karnataka' },
  hubli: { name: 'Hubballi-Dharwad Municipal Corporation', state: 'Karnataka' },
  mangalore: { name: 'Mangaluru City Corporation', state: 'Karnataka' },
  delhi: { name: 'Municipal Corporation of Delhi', state: 'Delhi' },
  'new delhi': { name: 'New Delhi Municipal Council', state: 'Delhi' },
  hyderabad: { name: 'Greater Hyderabad Municipal Corporation', state: 'Telangana' },
  visakhapatnam: { name: 'Greater Visakhapatnam Municipal Corporation', state: 'Andhra Pradesh' },
  vijayawada: { name: 'Vijayawada Municipal Corporation', state: 'Andhra Pradesh' },
  guntur: { name: 'Guntur Municipal Corporation', state: 'Andhra Pradesh' },
  kolkata: { name: 'Kolkata Municipal Corporation', state: 'West Bengal' },
  howrah: { name: 'Howrah Municipal Corporation', state: 'West Bengal' },
  ahmedabad: { name: 'Ahmedabad Municipal Corporation', state: 'Gujarat' },
  surat: { name: 'Surat Municipal Corporation', state: 'Gujarat' },
  vadodara: { name: 'Vadodara Municipal Corporation', state: 'Gujarat' },
  rajkot: { name: 'Rajkot Municipal Corporation', state: 'Gujarat' },
  lucknow: { name: 'Lucknow Municipal Corporation', state: 'Uttar Pradesh' },
  kanpur: { name: 'Kanpur Nagar Nigam', state: 'Uttar Pradesh' },
  agra: { name: 'Agra Municipal Corporation', state: 'Uttar Pradesh' },
  varanasi: { name: 'Varanasi Nagar Nigam', state: 'Uttar Pradesh' },
  jaipur: { name: 'Jaipur Municipal Corporation', state: 'Rajasthan' },
  jodhpur: { name: 'Jodhpur Municipal Corporation', state: 'Rajasthan' },
  bhopal: { name: 'Bhopal Municipal Corporation', state: 'Madhya Pradesh' },
  indore: { name: 'Indore Municipal Corporation', state: 'Madhya Pradesh' },
  chandigarh: { name: 'Municipal Corporation Chandigarh', state: 'Chandigarh' },
  ludhiana: { name: 'Municipal Corporation Ludhiana', state: 'Punjab' },
  amritsar: { name: 'Municipal Corporation Amritsar', state: 'Punjab' },
  thiruvananthapuram: { name: 'Thiruvananthapuram Corporation', state: 'Kerala' },
  kochi: { name: 'Kochi Municipal Corporation', state: 'Kerala' },
  kozhikode: { name: 'Kozhikode Municipal Corporation', state: 'Kerala' },
};

export function normalizeCity(city) {
  return String(city || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/city$/g, '').replace(/corporation$/g, '').trim();
}

export function getMunicipalPreview(city) {
  const key = normalizeCity(city);
  if (MUNICIPAL_CITY_MAP[key]) return { ...MUNICIPAL_CITY_MAP[key], recognized: true };
  for (const mapKey of Object.keys(MUNICIPAL_CITY_MAP)) {
    if (key && (key.includes(mapKey) || mapKey.includes(key))) return { ...MUNICIPAL_CITY_MAP[mapKey], recognized: true };
  }
  return { name: 'Municipal Corporation', state: 'India', recognized: false };
}
