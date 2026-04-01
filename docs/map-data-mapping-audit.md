# Map-Data Mapping Audit (World / Regional / USA)

- Generated on: 2026-04-01
- Snapshot date used for checks: 2023-03-09
- Code baseline: current local workspace

## Scope

- Level 1: world map (country level) is not re-audited here; this document focuses on regional/subregional mapping status and gaps.
- Level 2: country -> regional map assets from `regionalMapRawByCountryName` in `WorldProjectionMap.jsx`.
- USA Level 2: `src/assets/USAmap/usa.svg` with explicit `US-XX` mapping logic.
- USA Level 3: `src/assets/USAmap/usa-xx.svg` maps where available.

## Executive Summary

- Regional country maps configured: 24
- Regional country maps with data available: 24
- Regional country maps with partial/unmapped rows: 13
- Countries with regional data but no configured map asset: 1
- USA level-2 mapped rows: 51/58
- USA level-3 states with map+data+full mapping: 11
- USA level-3 states with map+data but partial mapping: 39
- USA level-3 states with map but no level-3 data snapshot: 0
- USA level-3 states with data but no state map: 1

## A) Regional Country Maps (Configured in Code)

| Country | Map Asset | Data Available | Data Rows | Mapped Rows | Unmapped Rows | Note |
|---|---|---:|---:|---:|---:|---|
| Australia | src\assets\AustraliaMap.svg | 1 | 8 | 8 | 0 | Full mapping for this snapshot date. |
| Belgium | src\assets\BelgiumMap.svg | 1 | 12 | 1 | 11 | Partial mapping (some data rows could not bind to map paths). |
| Brazil | src\assets\BrazilMap.svg | 1 | 27 | 27 | 0 | Full mapping for this snapshot date. |
| Canada | src\assets\CanadaMap.svg | 1 | 16 | 0 | 16 | Partial mapping (some data rows could not bind to map paths). |
| Chile | src\assets\Chile.svg | 1 | 17 | 16 | 1 | Partial mapping (some data rows could not bind to map paths). |
| Colombia | src\assets\ColombiaMap.svg | 1 | 33 | 33 | 0 | Full mapping for this snapshot date. |
| Denmark | src\assets\DenmarkMap.svg | 1 | 2 | 0 | 2 | Partial mapping (some data rows could not bind to map paths). |
| France | src\assets\FranceMap.svg | 1 | 12 | 0 | 12 | Partial mapping (some data rows could not bind to map paths). |
| Germany | src\assets\GermanyMap.svg | 1 | 16 | 16 | 0 | Full mapping for this snapshot date. |
| India | src\assets\IndiaMap.svg | 1 | 36 | 36 | 0 | Full mapping for this snapshot date. |
| Italy | src\assets\ItalyMap.svg | 1 | 21 | 19 | 2 | Partial mapping (some data rows could not bind to map paths). |
| Japan | src\assets\JapaneseMap.svg | 1 | 49 | 47 | 2 | Partial mapping (some data rows could not bind to map paths). |
| Malaysia | src\assets\MalaysiaMap.svg | 1 | 16 | 16 | 0 | Full mapping for this snapshot date. |
| Mexico | src\assets\MexicoMap.svg | 1 | 31 | 31 | 0 | Full mapping for this snapshot date. |
| Netherlands | src\assets\NetherlandsMap.svg | 1 | 17 | 12 | 5 | Partial mapping (some data rows could not bind to map paths). |
| New Zealand | src\assets\NewZealandMap.svg | 1 | 2 | 0 | 2 | Partial mapping (some data rows could not bind to map paths). |
| Pakistan | src\assets\PakistanMap.svg | 1 | 7 | 7 | 0 | Full mapping for this snapshot date. |
| Peru | src\assets\PeruMap.svg | 1 | 26 | 25 | 1 | Partial mapping (some data rows could not bind to map paths). |
| Russia | src\assets\RussiaMap.svg | 1 | 83 | 83 | 0 | Full mapping for this snapshot date. |
| Spain | src\assets\SpainMap.svg | 1 | 19 | 19 | 0 | Full mapping for this snapshot date. |
| Sweden | src\assets\SwedenMap.svg | 1 | 21 | 21 | 0 | Full mapping for this snapshot date. |
| Ukraine | src\assets\UkraineMap.svg | 1 | 28 | 26 | 2 | Partial mapping (some data rows could not bind to map paths). |
| United Kingdom | src\assets\United KingdomMap.svg | 1 | 18 | 0 | 18 | Partial mapping (some data rows could not bind to map paths). |
| United States | src\assets\UnitedStatesMap.svg | 1 | 58 | 51 | 7 | Partial mapping (some data rows could not bind to map paths). |

### Regional Partial/Unmapped Details

- **Belgium** (1/12 mapped)
  - Unmapped rows: Antwerp, East Flanders, Flemish Brabant, Hainaut, Liege, Limburg, Luxembourg, Namur, Unknown, Walloon Brabant, West Flanders
- **Canada** (0/16 mapped)
  - Unmapped rows: Alberta, British Columbia, Diamond Princess, Grand Princess, Manitoba, New Brunswick, Newfoundland and Labrador, Northwest Territories, Nova Scotia, Nunavut, Ontario, Prince Edward Island, Quebec, Repatriated Travellers, Saskatchewan, Yukon
- **Chile** (16/17 mapped)
  - Unmapped rows: Unknown
- **Denmark** (0/2 mapped)
  - Unmapped rows: Faroe Islands, Greenland
- **France** (0/12 mapped)
  - Unmapped rows: France Mainland, French Guiana, French Polynesia, Guadeloupe, Martinique, Mayotte, New Caledonia, Reunion, Saint Barthelemy, Saint Pierre and Miquelon, St Martin, Wallis and Futuna
- **Italy** (19/21 mapped)
  - Unmapped rows: P.A. Bolzano, P.A. Trento
- **Japan** (47/49 mapped)
  - Unmapped rows: Port Quarantine, Unknown
- **Netherlands** (12/17 mapped)
  - Unmapped rows: Aruba, Bonaire, Sint Eustatius and Saba, Curacao, Sint Maarten, Unknown
- **New Zealand** (0/2 mapped)
  - Unmapped rows: Cook Islands, Niue
- **Peru** (25/26 mapped)
  - Unmapped rows: Unknown
- **Ukraine** (26/28 mapped)
  - Unmapped rows: Kiev, Unknown
- **United Kingdom** (0/18 mapped)
  - Unmapped rows: Anguilla, Bermuda, British Virgin Islands, Cayman Islands, England, Falkland Islands (Malvinas), Gibraltar, Guernsey, Isle of Man, Jersey, Montserrat, Northern Ireland, Pitcairn Islands, Saint Helena, Ascension and Tristan da Cunha, Scotland, Turks and Caicos Islands, Unknown, Wales
- **United States** (51/58 mapped)
  - Unmapped rows: American Samoa, Diamond Princess, Grand Princess, Guam, Northern Mariana Islands, Puerto Rico, Virgin Islands

## B) Map Asset Exists but Regional Data Snapshot Not Found

- None

## C) Regional Data Exists but No Configured Map Asset

- China

## D) USA Level-2 (States on `usa.svg`)

- Mapped rows: 51/58
- Unmapped rows: American Samoa, Diamond Princess, Grand Princess, Guam, Northern Mariana Islands, Puerto Rico, Virgin Islands

## E) USA Level-3 (State Subregion Maps)

| State | State Code | Map File | Data Available | Data Rows | Mapped Rows | Unmapped Rows |
|---|---|---|---:|---:|---:|---:|
| Alabama | AL | src/assets/USAmap/usa-al.svg | 1 | 67 | 67 | 0 |
| Alaska | AK | src/assets/USAmap/usa-ak.svg | 1 | 29 | 18 | 11 |
| Arizona | AZ | src/assets/USAmap/usa-az.svg | 1 | 15 | 15 | 0 |
| Arkansas | AR | src/assets/USAmap/usa-ar.svg | 1 | 76 | 75 | 1 |
| California | CA | src/assets/USAmap/usa-ca.svg | 1 | 59 | 57 | 2 |
| Colorado | CO | src/assets/USAmap/usa-co.svg | 1 | 65 | 64 | 1 |
| Connecticut | CT | src/assets/USAmap/usa-ct.svg | 1 | 9 | 8 | 1 |
| Delaware | DE | src/assets/USAmap/usa-de.svg | 1 | 4 | 3 | 1 |
| District Of Columbia | DC | src/assets/USAmap/usa-wdc.svg | 1 | 1 | 0 | 1 |
| Florida | FL | src/assets/USAmap/usa-fl.svg | 1 | 68 | 66 | 2 |
| Georgia | GA | src/assets/USAmap/usa-ga.svg | 1 | 161 | 159 | 2 |
| Hawaii | HI | src/assets/USAmap/usa-hi.svg | 1 | 5 | 4 | 1 |
| Idaho | ID | src/assets/USAmap/usa-id.svg | 1 | 44 | 44 | 0 |
| Illinois | IL | src/assets/USAmap/usa-il.svg | 1 | 104 | 96 | 8 |
| Indiana | IN | src/assets/USAmap/usa-in.svg | 1 | 93 | 92 | 1 |
| Iowa | IA | src/assets/USAmap/usa-ia.svg | 1 | 99 | 98 | 1 |
| Kansas | KS | src/assets/USAmap/usa-ks.svg | 1 | 105 | 105 | 0 |
| Kentucky | KY | src/assets/USAmap/usa-ky.svg | 1 | 121 | 120 | 1 |
| Louisiana | LA | src/assets/USAmap/usa-la.svg | 1 | 65 | 64 | 1 |
| Maryland | MD | src/assets/USAmap/usa-md.svg | 1 | 25 | 23 | 2 |
| Massachusetts | MA | src/assets/USAmap/usa-ma.svg | 1 | 14 | 12 | 2 |
| Michigan | MI | src/assets/USAmap/usa-mi.svg | 1 | 87 | 82 | 5 |
| Minnesota | MN | src/assets/USAmap/usa-mn.svg | 1 | 88 | 87 | 1 |
| Mississippi | MS | src/assets/USAmap/usa-ms.svg | 1 | 82 | 82 | 0 |
| Missouri | MO | src/assets/USAmap/usa-mo.svg | 1 | 116 | 112 | 4 |
| Montana | MT | src/assets/USAmap/usa-mt.svg | 1 | 56 | 56 | 0 |
| Nebraska | NE | src/assets/USAmap/usa-ne.svg | 1 | 94 | 93 | 1 |
| Nevada | NV | src/assets/USAmap/usa-nv.svg | 1 | 18 | 16 | 2 |
| New Hampshire | NH | src/assets/USAmap/usa-nh.svg | 1 | 11 | 10 | 1 |
| New Jersey | NJ | src/assets/USAmap/usa-nj.svg | 1 | 22 | 21 | 1 |
| New Mexico | NM | src/assets/USAmap/usa-nm.svg | 1 | 34 | 31 | 3 |
| New York | NY | src/assets/USAmap/usa-ny (1).svg | 1 | 64 | 61 | 3 |
| North Carolina | NC | src/assets/USAmap/usa-nc.svg | 1 | 100 | 100 | 0 |
| North Dakota | ND | src/assets/USAmap/usa-nd.svg | 1 | 54 | 53 | 1 |
| Ohio | OH | src/assets/USAmap/usa-oh.svg | 1 | 89 | 88 | 1 |
| Oklahoma | OK | src/assets/USAmap/usa-ok.svg | 1 | 78 | 77 | 1 |
| Oregon | OR | src/assets/USAmap/usa-or.svg | 1 | 37 | 36 | 1 |
| Pennsylvania | PA | src/assets/USAmap/usa-pa.svg | 1 | 67 | 67 | 0 |
| Rhode Island | RI | src/assets/USAmap/usa-ri.svg | 1 | 6 | 5 | 1 |
| South Carolina | SC | src/assets/USAmap/usa-sc.svg | 1 | 46 | 46 | 0 |
| South Dakota | SD | src/assets/USAmap/usa-sd.svg | 1 | 66 | 63 | 3 |
| Tennessee | TN | src/assets/USAmap/usa-tn.svg | 1 | 97 | 95 | 2 |
| Texas | TX | src/assets/USAmap/usa-tx.svg | 1 | 255 | 254 | 1 |
| Utah | UT | src/assets/USAmap/usa-ut.svg | 1 | 14 | 6 | 8 |
| Vermont | VT | src/assets/USAmap/usa-vt.svg | 1 | 15 | 13 | 2 |
| Virginia | VA | src/assets/USAmap/usa-va.svg | 1 | 133 | 132 | 1 |
| Washington | WA | src/assets/USAmap/usa-wa.svg | 1 | 40 | 39 | 1 |
| West Virginia | WV | src/assets/USAmap/usa-wv.svg | 1 | 56 | 55 | 1 |
| Wisconsin | WI | src/assets/USAmap/usa-wi.svg | 1 | 72 | 72 | 0 |
| Wyoming | WY | src/assets/USAmap/usa-wy.svg | 1 | 23 | 23 | 0 |

### USA Level-3 Partial/Unmapped Details

- **Alaska** (18/29 mapped)
  - Unmapped rows: Bristol Bay plus Lake and Peninsula, Chugach, Copper River, Fairbanks North Star, Kusilvak, Petersburg, Prince of Wales-Hyder, Skagway, Southeast Fairbanks, Unassigned, Wrangell
- **Arkansas** (75/76 mapped)
  - Unmapped rows: Unassigned
- **California** (57/59 mapped)
  - Unmapped rows: San Francisco, Unassigned
- **Colorado** (64/65 mapped)
  - Unmapped rows: Unassigned
- **Connecticut** (8/9 mapped)
  - Unmapped rows: Unassigned
- **Delaware** (3/4 mapped)
  - Unmapped rows: Unassigned
- **District Of Columbia** (0/1 mapped)
  - Unmapped rows: 
- **Florida** (66/68 mapped)
  - Unmapped rows: Lake, Unassigned
- **Georgia** (159/161 mapped)
  - Unmapped rows: Out of GA, Unassigned
- **Hawaii** (4/5 mapped)
  - Unmapped rows: Out of HI
- **Illinois** (96/104 mapped)
  - Unmapped rows: De Witt, Jo Daviess, LaSalle, McDonough, Out of IL, Rock Island, St. Clair, Unassigned
- **Indiana** (92/93 mapped)
  - Unmapped rows: Unassigned
- **Iowa** (98/99 mapped)
  - Unmapped rows: Mitchell
- **Kentucky** (120/121 mapped)
  - Unmapped rows: Unassigned
- **Louisiana** (64/65 mapped)
  - Unmapped rows: Unassigned
- **Maryland** (23/25 mapped)
  - Unmapped rows: Baltimore, Unassigned
- **Massachusetts** (12/14 mapped)
  - Unmapped rows: Dukes and Nantucket, Unassigned
- **Michigan** (82/87 mapped)
  - Unmapped rows: Federal Correctional Institution (FCI), Grand Traverse, Michigan Department of Corrections (MDOC), Out of MI, Unassigned
- **Minnesota** (87/88 mapped)
  - Unmapped rows: Unassigned
- **Missouri** (112/116 mapped)
  - Unmapped rows: Gasconade, Kansas City, Ste. Genevieve, Worth
- **Nebraska** (93/94 mapped)
  - Unmapped rows: Unassigned
- **Nevada** (16/18 mapped)
  - Unmapped rows: Lyon, Unassigned
- **New Hampshire** (10/11 mapped)
  - Unmapped rows: Unassigned
- **New Jersey** (21/22 mapped)
  - Unmapped rows: Unassigned
- **New Mexico** (31/34 mapped)
  - Unmapped rows: Guadalupe, McKinley, Unassigned
- **New York** (61/64 mapped)
  - Unmapped rows: Out of NY, Staten Island, Unassigned
- **North Dakota** (53/54 mapped)
  - Unmapped rows: Unassigned
- **Ohio** (88/89 mapped)
  - Unmapped rows: Unassigned
- **Oklahoma** (77/78 mapped)
  - Unmapped rows: Unassigned
- **Oregon** (36/37 mapped)
  - Unmapped rows: Unassigned
- **Rhode Island** (5/6 mapped)
  - Unmapped rows: Unassigned
- **South Dakota** (63/66 mapped)
  - Unmapped rows: Grant, Kingsbury, Oglala Lakota
- **Tennessee** (95/97 mapped)
  - Unmapped rows: Out of TN, Unassigned
- **Texas** (254/255 mapped)
  - Unmapped rows: Unassigned
- **Utah** (6/14 mapped)
  - Unmapped rows: Bear River, Central Utah, Southeast Utah, Southwest Utah, Summit, TriCounty, Unassigned, Weber-Morgan
- **Vermont** (13/15 mapped)
  - Unmapped rows: Chittenden, Unassigned
- **Virginia** (132/133 mapped)
  - Unmapped rows: Albemarle
- **Washington** (39/40 mapped)
  - Unmapped rows: Unassigned
- **West Virginia** (55/56 mapped)
  - Unmapped rows: Unassigned

### USA Level-3 Data/Map Gaps

- States with map but no level-3 data snapshot:
  - None
- States with level-3 data but no map asset:
  - Maine

## Notes for Future Development

- This audit distinguishes **name mismatch** from **no-shape entries** (aggregated/offline/cruise/out-of-state categories).
- USA level-2 runtime mapping uses explicit state-code binding (`US-XX`) to avoid fuzzy misbinding.
- USA level-3 runtime mapping keeps fuzzy matching disabled to prioritize deterministic behavior.
- Re-run this audit whenever map assets or `c_data` snapshots are updated.
