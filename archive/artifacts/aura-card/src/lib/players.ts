// Curated football player dataset used to match a user's Aura Card to the pro
// they most resemble. Each player has a profile over the same six stats the card
// uses (speed, clutch, iq, chaos, loyalty, banter), a position, playstyle
// keywords, and a short blurb used to explain the match.
//
// This is intentionally self-contained so the feature works with zero external
// dependencies. When the Solana sports-data API is wired in, replace or augment
// this list via loadPlayers() in playerMatch.ts. `photoUrl` is optional and the
// UI falls back to a flag + initials monogram when it is absent.

export interface PlayerStatProfile {
  speed: number;
  clutch: number;
  iq: number;
  chaos: number;
  loyalty: number;
  banter: number;
}

export interface Player {
  id: string;
  name: string;
  nation: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  keywords: string[];
  profile: PlayerStatProfile;
  blurb: string;
  photoUrl?: string;
  /**
   * Resemblance rarity gate. Undefined players can match any card. "star"
   * players only surface on Icon+ cards; "goat" players (Messi, Ronaldo) only
   * on Legendary/Mythic cards - so mirroring a GOAT is genuinely rare.
   * See matchPlayer() in playerMatch.ts.
   */
  eliteTier?: "star" | "goat";
}

export const PLAYERS: Player[] = [
  {
    id: "messi",
    name: "Lionel Messi",
    nation: "Argentina",
    position: "FWD",
    keywords: ["vision", "clutch", "genius", "aura"],
    profile: { speed: 82, clutch: 96, iq: 99, chaos: 55, loyalty: 88, banter: 60 },
    blurb: "a calm genius who decides finals with a single moment of vision",
    eliteTier: "goat",
  },
  {
    id: "dimaria",
    name: "Angel Di Maria",
    nation: "Argentina",
    position: "FWD",
    keywords: ["clutch", "finals", "loyalty"],
    profile: { speed: 84, clutch: 90, iq: 82, chaos: 58, loyalty: 90, banter: 55 },
    blurb: "the big-game specialist who saves his best for finals",
  },
  {
    id: "ronaldo",
    name: "Cristiano Ronaldo",
    nation: "Portugal",
    position: "FWD",
    keywords: ["power", "clutch", "confidence", "banter"],
    profile: { speed: 90, clutch: 92, iq: 80, chaos: 60, loyalty: 70, banter: 88 },
    blurb: "relentless self-belief and a walkout that demands the spotlight",
    eliteTier: "goat",
  },
  {
    id: "mbappe",
    name: "Kylian Mbappe",
    nation: "France",
    position: "FWD",
    keywords: ["speed", "power", "clutch"],
    profile: { speed: 99, clutch: 88, iq: 82, chaos: 62, loyalty: 68, banter: 66 },
    blurb: "pure acceleration and ice-cold finishing under pressure",
    eliteTier: "star",
  },
  {
    id: "griezmann",
    name: "Antoine Griezmann",
    nation: "France",
    position: "FWD",
    keywords: ["iq", "loyalty", "workrate"],
    profile: { speed: 78, clutch: 84, iq: 90, chaos: 45, loyalty: 92, banter: 70 },
    blurb: "the selfless brain who does the smart thing every time",
  },
  {
    id: "neymar",
    name: "Neymar Jr",
    nation: "Brazil",
    position: "FWD",
    keywords: ["flair", "chaos", "banter", "trickery"],
    profile: { speed: 88, clutch: 78, iq: 86, chaos: 92, loyalty: 66, banter: 95 },
    blurb: "flair, drama and total chaos energy with the ball at his feet",
    eliteTier: "star",
  },
  {
    id: "vinicius",
    name: "Vinicius Jr",
    nation: "Brazil",
    position: "FWD",
    keywords: ["speed", "flair", "chaos"],
    profile: { speed: 96, clutch: 80, iq: 78, chaos: 84, loyalty: 70, banter: 82 },
    blurb: "fearless dribbling and unbothered swagger down the wing",
    eliteTier: "star",
  },
  {
    id: "bellingham",
    name: "Jude Bellingham",
    nation: "England",
    position: "MID",
    keywords: ["clutch", "iq", "leadership"],
    profile: { speed: 82, clutch: 92, iq: 90, chaos: 58, loyalty: 82, banter: 68 },
    blurb: "a born leader who arrives late in the box when it matters most",
    eliteTier: "star",
  },
  {
    id: "kane",
    name: "Harry Kane",
    nation: "England",
    position: "FWD",
    keywords: ["iq", "finishing", "loyalty"],
    profile: { speed: 68, clutch: 90, iq: 92, chaos: 40, loyalty: 90, banter: 58 },
    blurb: "a complete striker who reads the game two passes ahead",
  },
  {
    id: "modric",
    name: "Luka Modric",
    nation: "Croatia",
    position: "MID",
    keywords: ["iq", "vision", "loyalty"],
    profile: { speed: 74, clutch: 88, iq: 97, chaos: 46, loyalty: 94, banter: 60 },
    blurb: "an ageless midfield metronome who never stops running",
  },
  {
    id: "debruyne",
    name: "Kevin De Bruyne",
    nation: "Belgium",
    position: "MID",
    keywords: ["vision", "iq", "passing"],
    profile: { speed: 80, clutch: 86, iq: 98, chaos: 52, loyalty: 80, banter: 62 },
    blurb: "the ultimate playmaker who sees passes no one else does",
  },
  {
    id: "haaland",
    name: "Erling Haaland",
    nation: "Norway",
    position: "FWD",
    keywords: ["power", "finishing", "clutch"],
    profile: { speed: 88, clutch: 94, iq: 78, chaos: 55, loyalty: 78, banter: 72 },
    blurb: "a relentless goal machine built purely to score",
    eliteTier: "star",
  },
  {
    id: "vandijk",
    name: "Virgil van Dijk",
    nation: "Netherlands",
    position: "DEF",
    keywords: ["leadership", "loyalty", "calm"],
    profile: { speed: 80, clutch: 88, iq: 90, chaos: 30, loyalty: 92, banter: 64 },
    blurb: "the calm defensive wall who never looks rushed",
  },
  {
    id: "pedri",
    name: "Pedri",
    nation: "Spain",
    position: "MID",
    keywords: ["iq", "vision", "composure"],
    profile: { speed: 76, clutch: 82, iq: 95, chaos: 44, loyalty: 86, banter: 58 },
    blurb: "a composed young brain who keeps the ball ticking",
  },
  {
    id: "rodri",
    name: "Rodri",
    nation: "Spain",
    position: "MID",
    keywords: ["iq", "control", "loyalty"],
    profile: { speed: 70, clutch: 90, iq: 94, chaos: 38, loyalty: 90, banter: 60 },
    blurb: "the tempo-setter who controls a match without breaking sweat",
  },
  {
    id: "musiala",
    name: "Jamal Musiala",
    nation: "Germany",
    position: "MID",
    keywords: ["flair", "speed", "dribbling"],
    profile: { speed: 86, clutch: 80, iq: 88, chaos: 74, loyalty: 78, banter: 66 },
    blurb: "a silky dribbler who glides through crowded midfields",
  },
  {
    id: "yamal",
    name: "Lamine Yamal",
    nation: "Spain",
    position: "FWD",
    keywords: ["flair", "fearless", "speed"],
    profile: { speed: 90, clutch: 84, iq: 86, chaos: 78, loyalty: 76, banter: 80 },
    blurb: "a fearless teenager with no respect for reputations",
    eliteTier: "star",
  },
  {
    id: "salah",
    name: "Mohamed Salah",
    nation: "Egypt",
    position: "FWD",
    keywords: ["speed", "finishing", "loyalty"],
    profile: { speed: 92, clutch: 88, iq: 84, chaos: 50, loyalty: 88, banter: 66 },
    blurb: "a lethal, humble winger who just keeps delivering",
  },
  {
    id: "osimhen",
    name: "Victor Osimhen",
    nation: "Nigeria",
    position: "FWD",
    keywords: ["power", "speed", "hunger"],
    profile: { speed: 90, clutch: 86, iq: 76, chaos: 66, loyalty: 80, banter: 70 },
    blurb: "raw hunger and power leading the line",
  },
  {
    id: "mahrez",
    name: "Riyad Mahrez",
    nation: "Algeria",
    position: "FWD",
    keywords: ["flair", "left-foot", "calm"],
    profile: { speed: 82, clutch: 84, iq: 88, chaos: 62, loyalty: 78, banter: 74 },
    blurb: "a silky left foot that curls chaos into precision",
  },
  {
    id: "hakimi",
    name: "Achraf Hakimi",
    nation: "Morocco",
    position: "DEF",
    keywords: ["speed", "loyalty", "engine"],
    profile: { speed: 95, clutch: 82, iq: 80, chaos: 58, loyalty: 90, banter: 72 },
    blurb: "an all-action full-back with a rocket in each boot",
  },
  {
    id: "sonheungmin",
    name: "Son Heung-min",
    nation: "South Korea",
    position: "FWD",
    keywords: ["speed", "loyalty", "smile"],
    profile: { speed: 90, clutch: 88, iq: 84, chaos: 44, loyalty: 94, banter: 76 },
    blurb: "a two-footed captain who leads with a smile and a sprint",
  },
  {
    id: "mitoma",
    name: "Kaoru Mitoma",
    nation: "Japan",
    position: "FWD",
    keywords: ["dribbling", "iq", "flair"],
    profile: { speed: 88, clutch: 78, iq: 86, chaos: 70, loyalty: 82, banter: 60 },
    blurb: "a dribbling scientist who studied the art of beating a full-back",
  },
  {
    id: "alvarez",
    name: "Julian Alvarez",
    nation: "Argentina",
    position: "FWD",
    keywords: ["workrate", "clutch", "hunger"],
    profile: { speed: 84, clutch: 88, iq: 84, chaos: 54, loyalty: 86, banter: 64 },
    blurb: "a tireless finisher who pops up in the biggest moments",
  },
  {
    id: "saka",
    name: "Bukayo Saka",
    nation: "England",
    position: "FWD",
    keywords: ["speed", "bravery", "loyalty"],
    profile: { speed: 88, clutch: 84, iq: 86, chaos: 52, loyalty: 90, banter: 62 },
    blurb: "brave, humble and always willing to take the big responsibility",
  },
  {
    id: "gavi",
    name: "Gavi",
    nation: "Spain",
    position: "MID",
    keywords: ["chaos", "fight", "loyalty"],
    profile: { speed: 80, clutch: 80, iq: 84, chaos: 88, loyalty: 90, banter: 74 },
    blurb: "all heart and fire, pressing like every ball is his last",
  },
  {
    id: "valverde",
    name: "Federico Valverde",
    nation: "Uruguay",
    position: "MID",
    keywords: ["engine", "power", "loyalty"],
    profile: { speed: 88, clutch: 86, iq: 88, chaos: 60, loyalty: 90, banter: 60 },
    blurb: "a box-to-box engine who never stops covering ground",
  },
  {
    id: "nunez",
    name: "Darwin Nunez",
    nation: "Uruguay",
    position: "FWD",
    keywords: ["chaos", "power", "unpredictable"],
    profile: { speed: 92, clutch: 70, iq: 66, chaos: 96, loyalty: 74, banter: 84 },
    blurb: "beautiful chaos, capable of anything and everything at once",
  },
  {
    id: "kvara",
    name: "Khvicha Kvaratskhelia",
    nation: "Georgia",
    position: "FWD",
    keywords: ["flair", "dribbling", "chaos"],
    profile: { speed: 88, clutch: 80, iq: 84, chaos: 82, loyalty: 80, banter: 70 },
    blurb: "a wing wizard who turns defenders inside out",
  },
  {
    id: "pulisic",
    name: "Christian Pulisic",
    nation: "USA",
    position: "FWD",
    keywords: ["speed", "clutch", "leadership"],
    profile: { speed: 88, clutch: 84, iq: 82, chaos: 54, loyalty: 88, banter: 62 },
    blurb: "the talisman who carries a nation's hopes on the break",
  },
  {
    id: "davies",
    name: "Alphonso Davies",
    nation: "Canada",
    position: "DEF",
    keywords: ["speed", "energy", "joy"],
    profile: { speed: 98, clutch: 78, iq: 78, chaos: 66, loyalty: 86, banter: 82 },
    blurb: "a flying full-back with pure joy and rocket pace",
  },
  {
    id: "kudus",
    name: "Mohammed Kudus",
    nation: "Ghana",
    position: "MID",
    keywords: ["flair", "power", "dribbling"],
    profile: { speed: 86, clutch: 80, iq: 82, chaos: 80, loyalty: 80, banter: 72 },
    blurb: "an explosive dribbler who bullies his way through midfield",
  },
  {
    id: "admed",
    name: "Mehdi Taremi",
    nation: "Iran",
    position: "FWD",
    keywords: ["finishing", "iq", "clutch"],
    profile: { speed: 76, clutch: 88, iq: 86, chaos: 52, loyalty: 84, banter: 60 },
    blurb: "a clever poacher who finds space no one else sees",
  },
  {
    id: "bounou",
    name: "Yassine Bounou",
    nation: "Morocco",
    position: "GK",
    keywords: ["calm", "clutch", "shotstopper"],
    profile: { speed: 60, clutch: 96, iq: 88, chaos: 34, loyalty: 90, banter: 66 },
    blurb: "an ice-cold keeper who lives for penalty shootouts",
  },
  {
    id: "martinez",
    name: "Emiliano Martinez",
    nation: "Argentina",
    position: "GK",
    keywords: ["clutch", "banter", "mind-games"],
    profile: { speed: 58, clutch: 98, iq: 84, chaos: 72, loyalty: 88, banter: 96 },
    blurb: "the ultimate shootout villain who wins the war in your head",
  },
  {
    id: "szoboszlai",
    name: "Dominik Szoboszlai",
    nation: "Hungary",
    position: "MID",
    keywords: ["power", "leadership", "engine"],
    profile: { speed: 84, clutch: 84, iq: 88, chaos: 58, loyalty: 88, banter: 62 },
    blurb: "a driving captain with a thunderous shot and a big engine",
  },
];
