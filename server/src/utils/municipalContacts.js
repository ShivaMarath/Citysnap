const MUNICIPAL_CONTACTS = {
  chennai: { name: 'Greater Chennai Corporation', email: 'commissioner@chennaicorporation.gov.in', phone: '044-25384510', state: 'Tamil Nadu', website: 'https://chennaicorporation.gov.in' },
  coimbatore: { name: 'Coimbatore City Municipal Corporation', email: 'commissioner@ccmc.gov.in', state: 'Tamil Nadu' },
  madurai: { name: 'Madurai City Municipal Corporation', email: 'commr.madurai@tn.gov.in', state: 'Tamil Nadu' },
  tambaram: { name: 'Tambaram Municipal Corporation', email: 'commissioner@tambaram.tn.gov.in', state: 'Tamil Nadu' },
  tiruchirappalli: { name: 'Tiruchirappalli City Municipal Corporation', email: 'commissioner@tcmc.gov.in', state: 'Tamil Nadu' },
  salem: { name: 'Salem City Municipal Corporation', email: 'commissioner@salemsmart.in', state: 'Tamil Nadu' },
  tirunelveli: { name: 'Tirunelveli City Municipal Corporation', email: 'commissioner@tnulb.gov.in', state: 'Tamil Nadu' },
  vellore: { name: 'Vellore City Municipal Corporation', email: 'commissioner@vellorecorporation.in', state: 'Tamil Nadu' },
  erode: { name: 'Erode City Municipal Corporation', email: 'erodecorporation@gmail.com', state: 'Tamil Nadu' },
  thoothukudi: { name: 'Thoothukudi Municipal Corporation', email: 'commissioner@tuticorin.tn.gov.in', state: 'Tamil Nadu' },
  mumbai: { name: 'Brihanmumbai Municipal Corporation', email: 'commissioner@mcgm.gov.in', phone: '022-22694727', state: 'Maharashtra', website: 'https://mcgm.gov.in' },
  pune: { name: 'Pune Municipal Corporation', email: 'commissioner@punecorporation.org', state: 'Maharashtra', website: 'https://punecorporation.org' },
  nagpur: { name: 'Nagpur Municipal Corporation', email: 'commissioner@nagpurcorporation.gov.in', state: 'Maharashtra' },
  nashik: { name: 'Nashik Municipal Corporation', email: 'commissioner@nmc.gov.in', state: 'Maharashtra' },
  thane: { name: 'Thane Municipal Corporation', email: 'commissioner@thanecity.gov.in', state: 'Maharashtra' },
  aurangabad: { name: 'Aurangabad Municipal Corporation', email: 'commissioner@amcsmart.in', state: 'Maharashtra' },
  bangalore: { name: 'Bruhat Bengaluru Mahanagara Palike', email: 'commissioner@bbmp.gov.in', phone: '080-22221188', state: 'Karnataka', website: 'https://bbmp.gov.in' },
  bengaluru: { name: 'Bruhat Bengaluru Mahanagara Palike', email: 'commissioner@bbmp.gov.in', state: 'Karnataka' },
  mysore: { name: 'Mysuru City Corporation', email: 'commissioner@mysurucity.mrc.gov.in', state: 'Karnataka' },
  hubli: { name: 'Hubballi-Dharwad Municipal Corporation', email: 'commissioner@hdmc.gov.in', state: 'Karnataka' },
  mangalore: { name: 'Mangaluru City Corporation', email: 'commissioner@mangalorecity.mrc.gov.in', state: 'Karnataka' },
  delhi: { name: 'Municipal Corporation of Delhi', email: 'commissioner@mcd.gov.in', phone: '011-23936200', state: 'Delhi', website: 'https://mcd.gov.in' },
  'new delhi': { name: 'New Delhi Municipal Council', email: 'secretary@ndmc.gov.in', state: 'Delhi' },
  hyderabad: { name: 'Greater Hyderabad Municipal Corporation', email: 'commissioner@ghmc.gov.in', phone: '040-21111111', state: 'Telangana', website: 'https://ghmc.gov.in' },
  visakhapatnam: { name: 'Greater Visakhapatnam Municipal Corporation', email: 'commissioner@gvmc.gov.in', state: 'Andhra Pradesh' },
  vijayawada: { name: 'Vijayawada Municipal Corporation', email: 'commissioner@vmc.gov.in', state: 'Andhra Pradesh' },
  guntur: { name: 'Guntur Municipal Corporation', email: 'commissioner@gmc.gov.in', state: 'Andhra Pradesh' },
  kolkata: { name: 'Kolkata Municipal Corporation', email: 'commissioner@kmcgov.in', phone: '033-22861000', state: 'West Bengal', website: 'https://kmcgov.in' },
  howrah: { name: 'Howrah Municipal Corporation', email: 'commissioner@howrahcorporation.gov.in', state: 'West Bengal' },
  ahmedabad: { name: 'Ahmedabad Municipal Corporation', email: 'commissioner@ahmedabadcity.gov.in', phone: '079-25391811', state: 'Gujarat', website: 'https://ahmedabadcity.gov.in' },
  surat: { name: 'Surat Municipal Corporation', email: 'commissioner@suratmunicipal.org', state: 'Gujarat' },
  vadodara: { name: 'Vadodara Municipal Corporation', email: 'commissioner@vmc.gov.in', state: 'Gujarat' },
  rajkot: { name: 'Rajkot Municipal Corporation', email: 'commissioner@rmc.gov.in', state: 'Gujarat' },
  lucknow: { name: 'Lucknow Municipal Corporation', email: 'commissioner@lmc.up.gov.in', state: 'Uttar Pradesh' },
  kanpur: { name: 'Kanpur Nagar Nigam', email: 'commissioner@kanpurnagarnigam.in', state: 'Uttar Pradesh' },
  agra: { name: 'Agra Municipal Corporation', email: 'commissioner@agranagarnigam.com', state: 'Uttar Pradesh' },
  varanasi: { name: 'Varanasi Nagar Nigam', email: 'commissioner@vnn.up.gov.in', state: 'Uttar Pradesh' },
  jaipur: { name: 'Jaipur Municipal Corporation', email: 'commissioner@jaipurmc.org', state: 'Rajasthan' },
  jodhpur: { name: 'Jodhpur Municipal Corporation', email: 'commissioner@jodhpurmc.org', state: 'Rajasthan' },
  bhopal: { name: 'Bhopal Municipal Corporation', email: 'commissioner@bmcbhopal.com', state: 'Madhya Pradesh' },
  indore: { name: 'Indore Municipal Corporation', email: 'commissioner@imcindore.org', state: 'Madhya Pradesh' },
  chandigarh: { name: 'Municipal Corporation Chandigarh', email: 'commissioner@mcchandigarh.gov.in', state: 'Chandigarh' },
  ludhiana: { name: 'Municipal Corporation Ludhiana', email: 'commissioner@mcludhiana.gov.in', state: 'Punjab' },
  amritsar: { name: 'Municipal Corporation Amritsar', email: 'commissioner@mcamritsar.gov.in', state: 'Punjab' },
  thiruvananthapuram: { name: 'Thiruvananthapuram Corporation', email: 'secretary@tmc.kerala.gov.in', state: 'Kerala' },
  kochi: { name: 'Kochi Municipal Corporation', email: 'secretary@corporationofcochin.lsgkerala.gov.in', state: 'Kerala' },
  kozhikode: { name: 'Kozhikode Municipal Corporation', email: 'secretary@kozhikodecorporation.lsgkerala.gov.in', state: 'Kerala' },
  default: {
    name: process.env.MUNICIPAL_CORP_NAME || 'Municipal Corporation',
    email: process.env.AUTHORITY_EMAIL || 'authority@urbanwatch.com',
    state: process.env.MUNICIPAL_CITY || 'India',
  },
};

function normalizeCity(city) {
  return String(city || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/city$/g, '')
    .replace(/corporation$/g, '')
    .trim();
}

function getMunicipalContact(city) {
  try {
    const key = normalizeCity(city);
    if (!key) return MUNICIPAL_CONTACTS.default;
    if (MUNICIPAL_CONTACTS[key]) return MUNICIPAL_CONTACTS[key];

    for (const [mapKey, contact] of Object.entries(MUNICIPAL_CONTACTS)) {
      if (mapKey === 'default') continue;
      if (key.includes(mapKey) || mapKey.includes(key)) return contact;
    }
    return MUNICIPAL_CONTACTS.default;
  } catch (e) {
    return MUNICIPAL_CONTACTS.default;
  }
}

function getAllMunicipalContacts() {
  const contacts = { ...MUNICIPAL_CONTACTS };
  delete contacts.default;
  return contacts;
}

module.exports = { MUNICIPAL_CONTACTS, getMunicipalContact, getAllMunicipalContacts, normalizeCity };
