// Single source of truth for nation → ISO flag code (flagcdn / flag-icons style).
// Previously duplicated in Home, CardDetailModal, CommunityWall and
// CommunityCarousel; keep additions here only.
export const NATION_FLAGS: Record<string, string> = {
  Algeria: "dz",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Belgium: "be",
  Brazil: "br",
  Canada: "ca",
  "Cape Verde": "cv",
  Colombia: "co",
  Croatia: "hr",
  Curacao: "cw",
  Czechia: "cz",
  "DR Congo": "cd",
  Egypt: "eg",
  England: "gb-eng",
  France: "fr",
  Germany: "de",
  Ghana: "gh",
  Haiti: "ht",
  Iran: "ir",
  Iraq: "iq",
  Italy: "it",
  Jamaica: "jm",
  Japan: "jp",
  Jordan: "jo",
  Mexico: "mx",
  Morocco: "ma",
  Netherlands: "nl",
  "New Zealand": "nz",
  Nigeria: "ng",
  Panama: "pa",
  Portugal: "pt",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Scotland: "gb-sct",
  Senegal: "sn",
  "South Africa": "za",
  "South Korea": "kr",
  Spain: "es",
  Switzerland: "ch",
  Tunisia: "tn",
  Turkey: "tr",
  Uruguay: "uy",
  USA: "us",
  Uzbekistan: "uz",
};

// Sorted list of nations that have a flag - used to populate pickers.
export const FLAG_NATIONS = Object.keys(NATION_FLAGS).sort();

export function flagCode(nation: string): string | undefined {
  return NATION_FLAGS[nation];
}
