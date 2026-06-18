import { University } from "@/app/dashboard/property-add/property-add.schema";

export const cities = [
  "Aberdeen",
  "Aberystwyth",
  "Bangor",
  "Bath",
  "Belfast",
  "Birmingham",
  "Bournemouth",
  "Brighton",
  "Bristol",
  "Cambridge",
  "Canterbury",
  "Cardiff",
  "Coventry",
  "Dundee",
  "Durham",
  "Edinburgh",
  "Exeter",
  "Glasgow",
  "Hertfordshire",
  "Hull",
  "Lancaster",
  "Leeds",
  "Leicester",
  "Liverpool",
  "London",
  "Loughborough",
  "Manchester",
  "Newcastle",
  "Norwich",
  "Nottingham",
  "Oxford",
  "Plymouth",
  "Portsmouth",
  "Preston",
  "Reading",
  "Sheffield",
  "Southampton",
  "St Andrews",
  "Stirling",
  "Surrey",
  "Swansea",
  "Warwick",
  "Wrexham",
  "York",
  "Sunderland",
  "Bradford",
  "Stoke-on-Trent",
  "Derby",
] as const;

export const townsByCity = [
  // Aberdeen (0)
  [
    "Bridge of Don",
    "City Centre",
    "Ferryhill",
    "Kingswells",
    "Kittybrewster",
    "Old Aberdeen",
    "Rosemount",
    "Torry",
  ],
  // Aberystwyth (1)
  [
    "Bow Street",
    "Llanbadarn",
    "Machynlleth",
    "Penparcau",
    "Penglais",
    "Town Centre",
    "Trefechan",
    "University",
  ],
  // Bangor (2)
  [
    "Anglesey",
    "Bethesda",
    "Caernarfon",
    "City Centre",
    "Gwynedd",
    "Menai Bridge",
    "University",
    "Upper Bangor",
  ],
  // Bath (3)
  [
    "Bathwick",
    "Bear Flat",
    "Camden",
    "City Centre",
    "Larkhall",
    "Odd Down",
    "Oldfield Park",
    "Widcombe",
  ],
  // Belfast (4)
  [
    "Botanic",
    "Cathedral Quarter",
    "City Centre",
    "Lisburn Road",
    "Ormeau Road",
    "Queen's Quarter",
    "Stranmillis",
    "Titanic Quarter",
  ],
  // Birmingham (5)
  [
    "Coventry",
    "Dudley",
    "Sandwell",
    "Solihull",
    "Walsall",
    "West Bromwich",
    "Wolverhampton",
  ],
  // Bournemouth (6)
  [
    "Boscombe",
    "Charminster",
    "Pokesdown",
    "Southbourne",
    "Springbourne",
    "Town Centre",
    "Westbourne",
    "Winton",
  ],
  // Brighton (7)
  [
    "City Centre",
    "Fiveways",
    "Hanover",
    "Hove",
    "Kemptown",
    "North Laine",
    "Preston Park",
    "Rottingdean",
  ],
  // Bristol (8)
  [
    "Clifton",
    "Cotham",
    "Easton",
    "Montpelier",
    "Redland",
    "Southville",
    "St Pauls",
    "Totterdown",
  ],
  // Cambridge (9)
  [
    "Castle Hill",
    "Cherry Hinton",
    "Chesterton",
    "City Centre",
    "Girton",
    "Mill Road",
    "Newmarket Road",
    "Trumpington",
  ],
  // Canterbury (10)
  [
    "Bridge",
    "Chartham",
    "City Centre",
    "Harbledown",
    "Old Dover Road",
    "St Dunstan's",
    "University",
    "Whitstable Road",
  ],
  // Cardiff (11)
  [
    "Adamsdown",
    "Canton",
    "Cathays",
    "City Centre",
    "Heath",
    "Llandaff",
    "Pontcanna",
    "Roath",
  ],
  // Coventry (12)
  [
    "Binley",
    "Canley",
    "City Centre",
    "Earlsdon",
    "Foleshill",
    "Radford",
    "Tile Hill",
    "Westwood",
  ],
  // Dundee (13)
  [
    "Blackness",
    "Broughty Ferry",
    "City Centre",
    "Hilltown",
    "Lochee",
    "Stobswell",
    "Strathmartine",
    "West End",
  ],
  // Durham (14)
  [
    "Belmont",
    "Carrville",
    "City Centre",
    "Framwellgate Moor",
    "Gilesgate",
    "Neville's Cross",
    "Newton Hall",
    "Ushaw Moor",
  ],
  // Edinburgh (15)
  [
    "Bruntsfield",
    "Corstorphine",
    "Leith",
    "Marchmont",
    "Morningside",
    "Newington",
    "Portobello",
    "Stockbridge",
  ],
  // Exeter (16)
  [
    "Alphington",
    "City Centre",
    "Heavitree",
    "Mount Pleasant",
    "Pennsylvania",
    "Pinhoe",
    "St David's",
    "St Thomas",
  ],
  // Glasgow (17)
  [
    "Dennistoun",
    "Govan",
    "Maryhill",
    "Merchant City",
    "Partick",
    "Pollokshields",
    "Shawlands",
    "West End",
  ],
  // Hertfordshire (18)
  [
    "Bishops Stortford",
    "Hatfield",
    "Hemel Hempstead",
    "Hertford",
    "St Albans",
    "Stevenage",
    "Watford",
    "Welwyn Garden City",
  ],
  // Hull (19)
  [
    "Anlaby",
    "Beverley Road",
    "City Centre",
    "Cottingham",
    "Hessle",
    "Newland",
    "Princes Avenue",
    "Spring Bank",
  ],
  // Lancaster (20)
  [
    "Bailrigg",
    "Carnforth",
    "City Centre",
    "Galgate",
    "Heysham",
    "Morecambe",
    "Scotforth",
    "University",
  ],
  // Leeds (21)
  [
    "Leeds City Centre",
    "Holbeck",
    "Burley",
    "Woodhouse",
    "Hyde Park",
    "Headingley",
    "Chapel Allerton",
    "Meanwood",
    "Harehills",
    "Beeston",
    "Roundhay",
    "Moortown",
    "Alwoodley",
    "Horsforth",
    "Adel",
    "Pudsey",
    "Otley",
    "Morley",
    "Cross Gates",
    "Rothwell",
    "Garforth",
  ],
  // Leicester (22)
  [
    "City Centre",
    "Clarendon Park",
    "Highfields",
    "Knighton",
    "Oadby",
    "Stoneygate",
    "West End",
    "Wigston",
  ],
  // Liverpool (23)
  [
    "Bootle",
    "Crosby",
    "Halton",
    "Knowsley",
    "Sefton",
    "Southport",
    "St Helens",
    "Wirral",
  ],
  // London (24)
  [
    "Brent",
    "Bromley",
    "Camden",
    "Croydon",
    "Ealing",
    "Greenwich",
    "Hackney",
    "Hammersmith",
    "Hillingdon",
    "Hounslow",
    "Islington",
    "Kensington",
    "Kingston",
    "Lambeth",
    "Lewisham",
    "Richmond",
    "Southwark",
    "Tower Hamlets",
    "Wandsworth",
    "Westminster",
  ],
  // Loughborough (25)
  [
    "Derby Road",
    "Forest Road",
    "Lemyngton",
    "Nanpantan",
    "Shelthorpe",
    "Town Centre",
    "University",
    "Woodthorpe",
  ],
  // Manchester (26)
  [
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "Salford",
    "Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],
  // Newcastle (27)
  [
    "Byker",
    "City Centre",
    "Fenham",
    "Gosforth",
    "Heaton",
    "Jesmond",
    "Sandyford",
    "Walker",
  ],
  // Norwich (28)
  [
    "Bowthorpe",
    "Catton",
    "City Centre",
    "Earlham",
    "Golden Triangle",
    "Hellesdon",
    "Thorpe",
    "Unthank Road",
  ],
  // Nottingham (29)
  [
    "Beeston",
    "Hyson Green",
    "Lenton",
    "Mapperley",
    "Radford",
    "Sherwood",
    "The Park",
    "West Bridgford",
  ],
  // Oxford (30)
  [
    "City Centre",
    "Cowley",
    "East Oxford",
    "Headington",
    "Iffley",
    "Jericho",
    "North Oxford",
    "Summertown",
  ],
  // Plymouth (31)
  [
    "City Centre",
    "Devonport",
    "Lipson",
    "Mutley",
    "Peverell",
    "Plympton",
    "Plymstock",
    "Stonehouse",
  ],
  // Portsmouth (32)
  [
    "City Centre",
    "Cosham",
    "Fratton",
    "Gunwharf",
    "Milton",
    "Old Portsmouth",
    "Southsea",
    "Waterlooville",
  ],
  // Preston (33)
  [
    "Ashton",
    "City Centre",
    "Fulwood",
    "Ingol",
    "Lea",
    "Penwortham",
    "Ribbleton",
    "University",
  ],
  // Reading (34)
  [
    "Calcot",
    "Caversham",
    "Earley",
    "Tilehurst",
    "Town Centre",
    "University",
    "Wokingham",
    "Woodley",
  ],
  // Sheffield (35)
  [
    "Broomhill",
    "City Centre",
    "Crookes",
    "Ecclesall",
    "Heeley",
    "Hillsborough",
    "Kelham Island",
    "Walkley",
  ],
  // Southampton (36)
  [
    "Bassett",
    "Bedford Place",
    "City Centre",
    "Highfield",
    "Ocean Village",
    "Polygon",
    "Portswood",
    "Shirley",
  ],
  // St Andrews (37)
  [
    "Bell Street",
    "Hepburn Gardens",
    "Hope Street",
    "Market Street",
    "North Street",
    "Scores",
    "South Street",
    "Town Centre",
  ],
  // Stirling (38)
  [
    "Bannockburn",
    "Bridge of Allan",
    "Cambusbarron",
    "Causewayhead",
    "City Centre",
    "Dunblane",
    "St Ninians",
    "University",
  ],
  // Surrey (39)
  [
    "Camberley",
    "Epsom",
    "Farnham",
    "Guildford",
    "Leatherhead",
    "Redhill",
    "Reigate",
    "Woking",
  ],
  // Swansea (40)
  [
    "Brynmill",
    "City Centre",
    "Mount Pleasant",
    "Mumbles",
    "Sketty",
    "St Thomas",
    "Townhill",
    "Uplands",
  ],
  // Warwick (41)
  [
    "Cubbington",
    "Heathcote",
    "Kenilworth",
    "Leamington Spa",
    "Town Centre",
    "University",
    "Whitnash",
    "Woodloes",
  ],
  // Wrexham (42)
  [
    "Chirk",
    "Gresford",
    "Llangollen",
    "Marford",
    "Rossett",
    "Ruabon",
    "Town Centre",
    "University",
  ],
  // York (43)
  [
    "Acomb",
    "City Centre",
    "Clifton",
    "Dringhouses",
    "Fulford",
    "Heslington",
    "Heworth",
    "Tang Hall",
  ],
  // Sunderland (44)
  [
    "City Centre",
    "Hendon",
    "Roker",
    "Fulwell",
    "Monkwearmouth",
    "Southwick",
    "Whitburn",
    "Washington",
  ],
  // Bradford (45)
  [
    "City Centre",
    "Manningham",
    "Heaton",
    "Bolton",
    "Eccleshill",
    "Shipley",
    "Bingley",
    "Ilkley",
  ],
  // Stoke-on-Trent (46)
  [
    "City Centre",
    "Hanley",
    "Fenton",
    "Longton",
    "Stoke",
    "Newcastle-under-Lyme",
    "Kidsgrove",
    "Biddulph",
  ],
  // Derby (47)
  [
    "City Centre",
    "Allestree",
    "Chaddesden",
    "Mackworth",
    "Littleover",
    "Chellaston",
    "Spondon",
    "Oakwood",
  ],
] as const;

// Get city name from frontend index (0-based)
export const getCityName = (index: number): string => {
  if (index >= 0 && index < cities.length) {
    return cities[index];
  }
  return "Unknown City";
};

// Get town name from frontend indices (0-based)
export const getTownName = (cityIndex: number, townIndex: number): string => {
  if (
    cityIndex >= 0 &&
    cityIndex < townsByCity.length &&
    townIndex >= 0 &&
    townIndex < townsByCity[cityIndex].length
  ) {
    return townsByCity[cityIndex][townIndex];
  }
  return "Unknown Area";
};

// Convert from frontend (0-based) to backend (1-based) index
export const toBackendIndex = (index: number): number => index + 1;

// Convert frontend city-scoped area index to backend global area ID
export const toBackendAreaId = (
  cityIndex: number,
  areaIndex: number
): number => {
  // Calculate the starting area ID for the given city
  // Each city's areas are stored sequentially in the backend
  let startingAreaId = 1; // First area ID

  // Add up all the areas from previous cities
  for (let i = 0; i < cityIndex && i < townsByCity.length; i++) {
    startingAreaId += townsByCity[i].length;
  }

  // Add the area index within the current city
  return startingAreaId + areaIndex;
};

// Convert backend global area ID to frontend city-scoped indices
export const fromBackendAreaId = (
  backendAreaId: number
): { cityIndex: number; areaIndex: number } => {
  let currentAreaId = 1;

  for (let cityIndex = 0; cityIndex < townsByCity.length; cityIndex++) {
    const cityAreaCount = townsByCity[cityIndex].length;

    if (
      backendAreaId >= currentAreaId &&
      backendAreaId < currentAreaId + cityAreaCount
    ) {
      return {
        cityIndex,
        areaIndex: backendAreaId - currentAreaId,
      };
    }

    currentAreaId += cityAreaCount;
  }

  // Fallback
  return { cityIndex: 0, areaIndex: 0 };
};

// Convert from backend (1-based) to frontend (0-based) index
export const toFrontendIndex = (index: number): number => index - 1;

// Find city index by name
export const findCityIndexByName = (cityName: string): number => {
  return cities.findIndex((city) => city === cityName);
};

// Find area index by name within a city
export const findAreaIndexByName = (
  cityIndex: number,
  areaName: string
): number => {
  if (cityIndex >= 0 && cityIndex < townsByCity.length) {
    return townsByCity[cityIndex].findIndex((town) => town === areaName);
  }
  return -1;
};

// Find city index by backend ID (backend now uses 0-based indices)
export const findCityIndexById = (backendId: number): number => {
  // Backend now sends 0-based indices directly, no conversion needed
  return backendId;
};

// Find area index by backend ID (backend now uses 0-based indices)
// Note: Backend now sends 0-based city-scoped area indices directly
export const findAreaIndexById = (backendId: number): number => {
  // Backend now sends 0-based indices directly, no conversion needed
  return backendId;
};

export const universities: University[] = [
  { id: 1, name: "University of Oxford" },
  { id: 2, name: "University of Cambridge" },
  { id: 3, name: "Imperial College London" },
  { id: 4, name: "University College London" },
  { id: 5, name: "London School of Economics" },
  { id: 6, name: "University of Edinburgh" },
  { id: 7, name: "University of Manchester" },
  { id: 8, name: "King's College London" },
  { id: 9, name: "University of Bristol" },
  { id: 10, name: "University of Warwick" },
  { id: 11, name: "University of Glasgow" },
  { id: 12, name: "University of Birmingham" },
  { id: 13, name: "University of Sheffield" },
  { id: 14, name: "University of Leeds" },
  { id: 15, name: "University of Southampton" },
  { id: 16, name: "University of Nottingham" },
  { id: 17, name: "University of Liverpool" },
  { id: 18, name: "Queen Mary University of London" },
  { id: 19, name: "Durham University" },
  { id: 20, name: "University of York" },
  { id: 21, name: "University of Leicester" },
  { id: 22, name: "Coventry University" },
  { id: 23, name: "Cardiff University" },
  { id: 24, name: "Queen's University Belfast" },
  { id: 25, name: "University of Brighton" },
  { id: 26, name: "University of Portsmouth" },
  { id: 27, name: "University of Bath" },
  { id: 28, name: "Canterbury Christ Church University" },
  { id: 29, name: "University of Kent" },
  { id: 30, name: "University of Exeter" },
  { id: 31, name: "University of Hull" },
  { id: 32, name: "University of East Anglia" },
  { id: 33, name: "University of Plymouth" },
  { id: 34, name: "Swansea University" },
  { id: 35, name: "University of Aberdeen" },
  { id: 36, name: "University of Dundee" },
  { id: 37, name: "University of Stirling" },
  { id: 38, name: "University of St Andrews" },
  { id: 39, name: "Loughborough University" },
  { id: 40, name: "University of Reading" },
  { id: 41, name: "University of Surrey" },
  { id: 42, name: "University of Hertfordshire" },
  { id: 43, name: "Bournemouth University" },
  { id: 44, name: "University of Central Lancashire" },
  { id: 45, name: "Lancaster University" },
  { id: 46, name: "Bangor University" },
  { id: 47, name: "Aberystwyth University" },
  { id: 48, name: "Wrexham Glyndwr University" },
  { id: 49, name: "Newcastle University" },
  { id: 50, name: "Northumbria University" },
  { id: 51, name: "Leeds Beckett University" },
  { id: 52, name: "Sheffield Hallam University" },
  { id: 53, name: "University of the West of England" },
  { id: 54, name: "De Montfort University" },
  { id: 55, name: "Birmingham City University" },
  { id: 56, name: "Manchester Metropolitan University" },
  { id: 57, name: "Liverpool John Moores University" },
  { id: 58, name: "Edinburgh Napier University" },
  { id: 59, name: "Glasgow Caledonian University" },
  { id: 60, name: "University of Strathclyde" },
  { id: 61, name: "University of Sunderland" },
  { id: 62, name: "University of Bradford" },
  { id: 63, name: "Staffordshire University" },
  { id: 64, name: "University of Derby" },
];

// Helper function to map backend city data to frontend index

export const mapBackendCityToIndex = (cityData: any): number => {
  if (!cityData) return 0;

  if (typeof cityData === "object" && cityData.name) {
    // City is an object with name property
    const index = findCityIndexByName(cityData.name);
    return index === -1 ? 0 : index;
  } else if (typeof cityData === "object" && cityData.id) {
    // City is an object with id property
    const index = findCityIndexById(cityData.id);
    return index === -1 || index < 0 || index >= cities.length ? 0 : index;
  } else if (typeof cityData === "number") {
    // City is a backend ID
    const index = findCityIndexById(cityData);
    return index === -1 || index < 0 || index >= cities.length ? 0 : index;
  } else if (typeof cityData === "string") {
    // City is a string name
    const index = findCityIndexByName(cityData);
    return index === -1 ? 0 : index;
  }

  return 0; // Fallback
};

// Helper function to map backend area data to frontend index

export const mapBackendAreaToIndex = (
  areaData: any,
  cityIndex: number
): number => {
  if (!areaData || cityIndex < 0 || cityIndex >= townsByCity.length) return 0;

  if (typeof areaData === "object" && areaData.id !== undefined) {
    // Area is an object with id property
    // The backend sends city-scoped area index as the id
    const areaIndex = areaData.id;
    if (areaIndex >= 0 && areaIndex < townsByCity[cityIndex].length) {
      return areaIndex;
    }
    return 0;
  } else if (typeof areaData === "object" && areaData.name) {
    // Area is an object with name property
    const index = findAreaIndexByName(cityIndex, areaData.name);
    return index === -1 ? 0 : index;
  } else if (typeof areaData === "string") {
    // Area is a string name
    const index = findAreaIndexByName(cityIndex, areaData);
    return index === -1 ? 0 : index;
  } else if (typeof areaData === "number") {
    // Area is a number - assume it's a city-scoped area index
    if (areaData >= 0 && areaData < townsByCity[cityIndex].length) {
      return areaData;
    }
    return 0;
  }

  return 0; // Fallback
};
