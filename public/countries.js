// Static country/area mapping from the UN Statistics Division M49 table. No geolocation.
// Country/area names and grouping convey geography only, without political conclusions.
// The two statistical extensions are documented in the M49 FAQ on the same source page.
export const COUNTRY_MAPPING_SOURCE={
 url:'https://unstats.un.org/unsd/methodology/m49/',
 title:'UN Statistics Division — M49 country/area and geographic regions',
 lastChecked:'2026-10-22',
 notes:'UN regions adapted to Wanderly: Caribbean/Central/Northern America use North America; Western Asia and Iran use Middle East; Türkiye uses Europe to match the existing destination catalogue. Antarctica has no proximity region. Taiwan and Kosovo use the M49 FAQ statistical extensions. These broad editorial buckets are not measured distances or flight routes.'
};
export const COUNTRIES=[
 {
  "id": "004",
  "code": "AFG",
  "name": "Afghanistan",
  "officialName": "Afghanistan",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "008",
  "code": "ALB",
  "name": "Albania",
  "officialName": "Albania",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "012",
  "code": "DZA",
  "name": "Algeria",
  "officialName": "Algeria",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "016",
  "code": "ASM",
  "name": "American Samoa",
  "officialName": "American Samoa",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "020",
  "code": "AND",
  "name": "Andorra",
  "officialName": "Andorra",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "024",
  "code": "AGO",
  "name": "Angola",
  "officialName": "Angola",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "660",
  "code": "AIA",
  "name": "Anguilla",
  "officialName": "Anguilla",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "010",
  "code": "ATA",
  "name": "Antarctica",
  "officialName": "Antarctica",
  "unRegion": null,
  "subregion": "World",
  "region": "all"
 },
 {
  "id": "028",
  "code": "ATG",
  "name": "Antigua and Barbuda",
  "officialName": "Antigua and Barbuda",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "032",
  "code": "ARG",
  "name": "Argentina",
  "officialName": "Argentina",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "051",
  "code": "ARM",
  "name": "Armenia",
  "officialName": "Armenia",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "533",
  "code": "ABW",
  "name": "Aruba",
  "officialName": "Aruba",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "036",
  "code": "AUS",
  "name": "Australia",
  "officialName": "Australia",
  "unRegion": "Oceania",
  "subregion": "Australia and New Zealand",
  "region": "Oceania"
 },
 {
  "id": "040",
  "code": "AUT",
  "name": "Austria",
  "officialName": "Austria",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "031",
  "code": "AZE",
  "name": "Azerbaijan",
  "officialName": "Azerbaijan",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "044",
  "code": "BHS",
  "name": "Bahamas",
  "officialName": "Bahamas",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "048",
  "code": "BHR",
  "name": "Bahrain",
  "officialName": "Bahrain",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "050",
  "code": "BGD",
  "name": "Bangladesh",
  "officialName": "Bangladesh",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "052",
  "code": "BRB",
  "name": "Barbados",
  "officialName": "Barbados",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "112",
  "code": "BLR",
  "name": "Belarus",
  "officialName": "Belarus",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "056",
  "code": "BEL",
  "name": "Belgium",
  "officialName": "Belgium",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "084",
  "code": "BLZ",
  "name": "Belize",
  "officialName": "Belize",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "204",
  "code": "BEN",
  "name": "Benin",
  "officialName": "Benin",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "060",
  "code": "BMU",
  "name": "Bermuda",
  "officialName": "Bermuda",
  "unRegion": "Americas",
  "subregion": "Northern America",
  "region": "North America"
 },
 {
  "id": "064",
  "code": "BTN",
  "name": "Bhutan",
  "officialName": "Bhutan",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "068",
  "code": "BOL",
  "name": "Bolivia",
  "officialName": "Bolivia (Plurinational State of)",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "535",
  "code": "BES",
  "name": "Bonaire, Sint Eustatius and Saba",
  "officialName": "Bonaire, Sint Eustatius and Saba",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "070",
  "code": "BIH",
  "name": "Bosnia and Herzegovina",
  "officialName": "Bosnia and Herzegovina",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "072",
  "code": "BWA",
  "name": "Botswana",
  "officialName": "Botswana",
  "unRegion": "Africa",
  "subregion": "Southern Africa",
  "region": "Africa"
 },
 {
  "id": "074",
  "code": "BVT",
  "name": "Bouvet Island",
  "officialName": "Bouvet Island",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "076",
  "code": "BRA",
  "name": "Brazil",
  "officialName": "Brazil",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "086",
  "code": "IOT",
  "name": "British Indian Ocean Territory",
  "officialName": "British Indian Ocean Territory",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "092",
  "code": "VGB",
  "name": "British Virgin Islands",
  "officialName": "British Virgin Islands",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "096",
  "code": "BRN",
  "name": "Brunei",
  "officialName": "Brunei Darussalam",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "100",
  "code": "BGR",
  "name": "Bulgaria",
  "officialName": "Bulgaria",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "854",
  "code": "BFA",
  "name": "Burkina Faso",
  "officialName": "Burkina Faso",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "108",
  "code": "BDI",
  "name": "Burundi",
  "officialName": "Burundi",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "132",
  "code": "CPV",
  "name": "Cabo Verde",
  "officialName": "Cabo Verde",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "116",
  "code": "KHM",
  "name": "Cambodia",
  "officialName": "Cambodia",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "120",
  "code": "CMR",
  "name": "Cameroon",
  "officialName": "Cameroon",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "124",
  "code": "CAN",
  "name": "Canada",
  "officialName": "Canada",
  "unRegion": "Americas",
  "subregion": "Northern America",
  "region": "North America"
 },
 {
  "id": "136",
  "code": "CYM",
  "name": "Cayman Islands",
  "officialName": "Cayman Islands",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "140",
  "code": "CAF",
  "name": "Central African Republic",
  "officialName": "Central African Republic",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "148",
  "code": "TCD",
  "name": "Chad",
  "officialName": "Chad",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "152",
  "code": "CHL",
  "name": "Chile",
  "officialName": "Chile",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "156",
  "code": "CHN",
  "name": "China",
  "officialName": "China",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "162",
  "code": "CXR",
  "name": "Christmas Island",
  "officialName": "Christmas Island",
  "unRegion": "Oceania",
  "subregion": "Australia and New Zealand",
  "region": "Oceania"
 },
 {
  "id": "166",
  "code": "CCK",
  "name": "Cocos (Keeling) Islands",
  "officialName": "Cocos (Keeling) Islands",
  "unRegion": "Oceania",
  "subregion": "Australia and New Zealand",
  "region": "Oceania"
 },
 {
  "id": "170",
  "code": "COL",
  "name": "Colombia",
  "officialName": "Colombia",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "174",
  "code": "COM",
  "name": "Comoros",
  "officialName": "Comoros",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "178",
  "code": "COG",
  "name": "Congo",
  "officialName": "Congo",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "184",
  "code": "COK",
  "name": "Cook Islands",
  "officialName": "Cook Islands",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "188",
  "code": "CRI",
  "name": "Costa Rica",
  "officialName": "Costa Rica",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "191",
  "code": "HRV",
  "name": "Croatia",
  "officialName": "Croatia",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "192",
  "code": "CUB",
  "name": "Cuba",
  "officialName": "Cuba",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "531",
  "code": "CUW",
  "name": "Curaçao",
  "officialName": "Curaçao",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "196",
  "code": "CYP",
  "name": "Cyprus",
  "officialName": "Cyprus",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "203",
  "code": "CZE",
  "name": "Czechia",
  "officialName": "Czechia",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "384",
  "code": "CIV",
  "name": "Côte d’Ivoire",
  "officialName": "Côte d’Ivoire",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "180",
  "code": "COD",
  "name": "Democratic Republic of the Congo",
  "officialName": "Democratic Republic of the Congo",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "208",
  "code": "DNK",
  "name": "Denmark",
  "officialName": "Denmark",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "262",
  "code": "DJI",
  "name": "Djibouti",
  "officialName": "Djibouti",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "212",
  "code": "DMA",
  "name": "Dominica",
  "officialName": "Dominica",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "214",
  "code": "DOM",
  "name": "Dominican Republic",
  "officialName": "Dominican Republic",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "218",
  "code": "ECU",
  "name": "Ecuador",
  "officialName": "Ecuador",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "818",
  "code": "EGY",
  "name": "Egypt",
  "officialName": "Egypt",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "222",
  "code": "SLV",
  "name": "El Salvador",
  "officialName": "El Salvador",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "226",
  "code": "GNQ",
  "name": "Equatorial Guinea",
  "officialName": "Equatorial Guinea",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "232",
  "code": "ERI",
  "name": "Eritrea",
  "officialName": "Eritrea",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "233",
  "code": "EST",
  "name": "Estonia",
  "officialName": "Estonia",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "748",
  "code": "SWZ",
  "name": "Eswatini",
  "officialName": "Eswatini",
  "unRegion": "Africa",
  "subregion": "Southern Africa",
  "region": "Africa"
 },
 {
  "id": "231",
  "code": "ETH",
  "name": "Ethiopia",
  "officialName": "Ethiopia",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "238",
  "code": "FLK",
  "name": "Falkland Islands (Malvinas)",
  "officialName": "Falkland Islands (Malvinas)",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "234",
  "code": "FRO",
  "name": "Faroe Islands",
  "officialName": "Faroe Islands",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "242",
  "code": "FJI",
  "name": "Fiji",
  "officialName": "Fiji",
  "unRegion": "Oceania",
  "subregion": "Melanesia",
  "region": "Oceania"
 },
 {
  "id": "246",
  "code": "FIN",
  "name": "Finland",
  "officialName": "Finland",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "250",
  "code": "FRA",
  "name": "France",
  "officialName": "France",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "254",
  "code": "GUF",
  "name": "French Guiana",
  "officialName": "French Guiana",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "258",
  "code": "PYF",
  "name": "French Polynesia",
  "officialName": "French Polynesia",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "260",
  "code": "ATF",
  "name": "French Southern Territories",
  "officialName": "French Southern Territories",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "266",
  "code": "GAB",
  "name": "Gabon",
  "officialName": "Gabon",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "270",
  "code": "GMB",
  "name": "Gambia",
  "officialName": "Gambia",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "268",
  "code": "GEO",
  "name": "Georgia",
  "officialName": "Georgia",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "276",
  "code": "DEU",
  "name": "Germany",
  "officialName": "Germany",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "288",
  "code": "GHA",
  "name": "Ghana",
  "officialName": "Ghana",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "292",
  "code": "GIB",
  "name": "Gibraltar",
  "officialName": "Gibraltar",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "300",
  "code": "GRC",
  "name": "Greece",
  "officialName": "Greece",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "304",
  "code": "GRL",
  "name": "Greenland",
  "officialName": "Greenland",
  "unRegion": "Americas",
  "subregion": "Northern America",
  "region": "North America"
 },
 {
  "id": "308",
  "code": "GRD",
  "name": "Grenada",
  "officialName": "Grenada",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "312",
  "code": "GLP",
  "name": "Guadeloupe",
  "officialName": "Guadeloupe",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "316",
  "code": "GUM",
  "name": "Guam",
  "officialName": "Guam",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "320",
  "code": "GTM",
  "name": "Guatemala",
  "officialName": "Guatemala",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "831",
  "code": "GGY",
  "name": "Guernsey",
  "officialName": "Guernsey",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "324",
  "code": "GIN",
  "name": "Guinea",
  "officialName": "Guinea",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "624",
  "code": "GNB",
  "name": "Guinea-Bissau",
  "officialName": "Guinea-Bissau",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "328",
  "code": "GUY",
  "name": "Guyana",
  "officialName": "Guyana",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "332",
  "code": "HTI",
  "name": "Haiti",
  "officialName": "Haiti",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "334",
  "code": "HMD",
  "name": "Heard Island and McDonald Islands",
  "officialName": "Heard Island and McDonald Islands",
  "unRegion": "Oceania",
  "subregion": "Australia and New Zealand",
  "region": "Oceania"
 },
 {
  "id": "336",
  "code": "VAT",
  "name": "Holy See",
  "officialName": "Holy See",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "340",
  "code": "HND",
  "name": "Honduras",
  "officialName": "Honduras",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "344",
  "code": "HKG",
  "name": "Hong Kong",
  "officialName": "China, Hong Kong Special Administrative Region",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "348",
  "code": "HUN",
  "name": "Hungary",
  "officialName": "Hungary",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "352",
  "code": "ISL",
  "name": "Iceland",
  "officialName": "Iceland",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "356",
  "code": "IND",
  "name": "India",
  "officialName": "India",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "360",
  "code": "IDN",
  "name": "Indonesia",
  "officialName": "Indonesia",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "364",
  "code": "IRN",
  "name": "Iran",
  "officialName": "Iran (Islamic Republic of)",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Middle East"
 },
 {
  "id": "368",
  "code": "IRQ",
  "name": "Iraq",
  "officialName": "Iraq",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "372",
  "code": "IRL",
  "name": "Ireland",
  "officialName": "Ireland",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "833",
  "code": "IMN",
  "name": "Isle of Man",
  "officialName": "Isle of Man",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "376",
  "code": "ISR",
  "name": "Israel",
  "officialName": "Israel",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "380",
  "code": "ITA",
  "name": "Italy",
  "officialName": "Italy",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "388",
  "code": "JAM",
  "name": "Jamaica",
  "officialName": "Jamaica",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "392",
  "code": "JPN",
  "name": "Japan",
  "officialName": "Japan",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "832",
  "code": "JEY",
  "name": "Jersey",
  "officialName": "Jersey",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "400",
  "code": "JOR",
  "name": "Jordan",
  "officialName": "Jordan",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "398",
  "code": "KAZ",
  "name": "Kazakhstan",
  "officialName": "Kazakhstan",
  "unRegion": "Asia",
  "subregion": "Central Asia",
  "region": "Asia"
 },
 {
  "id": "404",
  "code": "KEN",
  "name": "Kenya",
  "officialName": "Kenya",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "296",
  "code": "KIR",
  "name": "Kiribati",
  "officialName": "Kiribati",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "412",
  "code": null,
  "name": "Kosovo",
  "officialName": "Kosovo",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "414",
  "code": "KWT",
  "name": "Kuwait",
  "officialName": "Kuwait",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "417",
  "code": "KGZ",
  "name": "Kyrgyzstan",
  "officialName": "Kyrgyzstan",
  "unRegion": "Asia",
  "subregion": "Central Asia",
  "region": "Asia"
 },
 {
  "id": "418",
  "code": "LAO",
  "name": "Laos",
  "officialName": "Lao People's Democratic Republic",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "428",
  "code": "LVA",
  "name": "Latvia",
  "officialName": "Latvia",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "422",
  "code": "LBN",
  "name": "Lebanon",
  "officialName": "Lebanon",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "426",
  "code": "LSO",
  "name": "Lesotho",
  "officialName": "Lesotho",
  "unRegion": "Africa",
  "subregion": "Southern Africa",
  "region": "Africa"
 },
 {
  "id": "430",
  "code": "LBR",
  "name": "Liberia",
  "officialName": "Liberia",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "434",
  "code": "LBY",
  "name": "Libya",
  "officialName": "Libya",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "438",
  "code": "LIE",
  "name": "Liechtenstein",
  "officialName": "Liechtenstein",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "440",
  "code": "LTU",
  "name": "Lithuania",
  "officialName": "Lithuania",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "442",
  "code": "LUX",
  "name": "Luxembourg",
  "officialName": "Luxembourg",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "446",
  "code": "MAC",
  "name": "Macao",
  "officialName": "China, Macao Special Administrative Region",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "450",
  "code": "MDG",
  "name": "Madagascar",
  "officialName": "Madagascar",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "454",
  "code": "MWI",
  "name": "Malawi",
  "officialName": "Malawi",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "458",
  "code": "MYS",
  "name": "Malaysia",
  "officialName": "Malaysia",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "462",
  "code": "MDV",
  "name": "Maldives",
  "officialName": "Maldives",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "466",
  "code": "MLI",
  "name": "Mali",
  "officialName": "Mali",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "470",
  "code": "MLT",
  "name": "Malta",
  "officialName": "Malta",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "584",
  "code": "MHL",
  "name": "Marshall Islands",
  "officialName": "Marshall Islands",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "474",
  "code": "MTQ",
  "name": "Martinique",
  "officialName": "Martinique",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "478",
  "code": "MRT",
  "name": "Mauritania",
  "officialName": "Mauritania",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "480",
  "code": "MUS",
  "name": "Mauritius",
  "officialName": "Mauritius",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "175",
  "code": "MYT",
  "name": "Mayotte",
  "officialName": "Mayotte",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "484",
  "code": "MEX",
  "name": "Mexico",
  "officialName": "Mexico",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "583",
  "code": "FSM",
  "name": "Micronesia",
  "officialName": "Micronesia (Federated States of)",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "498",
  "code": "MDA",
  "name": "Moldova",
  "officialName": "Republic of Moldova",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "492",
  "code": "MCO",
  "name": "Monaco",
  "officialName": "Monaco",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "496",
  "code": "MNG",
  "name": "Mongolia",
  "officialName": "Mongolia",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "499",
  "code": "MNE",
  "name": "Montenegro",
  "officialName": "Montenegro",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "500",
  "code": "MSR",
  "name": "Montserrat",
  "officialName": "Montserrat",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "504",
  "code": "MAR",
  "name": "Morocco",
  "officialName": "Morocco",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "508",
  "code": "MOZ",
  "name": "Mozambique",
  "officialName": "Mozambique",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "104",
  "code": "MMR",
  "name": "Myanmar",
  "officialName": "Myanmar",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "516",
  "code": "NAM",
  "name": "Namibia",
  "officialName": "Namibia",
  "unRegion": "Africa",
  "subregion": "Southern Africa",
  "region": "Africa"
 },
 {
  "id": "520",
  "code": "NRU",
  "name": "Nauru",
  "officialName": "Naoero",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "524",
  "code": "NPL",
  "name": "Nepal",
  "officialName": "Nepal",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "528",
  "code": "NLD",
  "name": "Netherlands",
  "officialName": "Netherlands (Kingdom of the)",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "540",
  "code": "NCL",
  "name": "New Caledonia",
  "officialName": "New Caledonia",
  "unRegion": "Oceania",
  "subregion": "Melanesia",
  "region": "Oceania"
 },
 {
  "id": "554",
  "code": "NZL",
  "name": "New Zealand",
  "officialName": "New Zealand",
  "unRegion": "Oceania",
  "subregion": "Australia and New Zealand",
  "region": "Oceania"
 },
 {
  "id": "558",
  "code": "NIC",
  "name": "Nicaragua",
  "officialName": "Nicaragua",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "562",
  "code": "NER",
  "name": "Niger",
  "officialName": "Niger",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "566",
  "code": "NGA",
  "name": "Nigeria",
  "officialName": "Nigeria",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "570",
  "code": "NIU",
  "name": "Niue",
  "officialName": "Niue",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "574",
  "code": "NFK",
  "name": "Norfolk Island",
  "officialName": "Norfolk Island",
  "unRegion": "Oceania",
  "subregion": "Australia and New Zealand",
  "region": "Oceania"
 },
 {
  "id": "408",
  "code": "PRK",
  "name": "North Korea",
  "officialName": "Democratic People's Republic of Korea",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "807",
  "code": "MKD",
  "name": "North Macedonia",
  "officialName": "North Macedonia",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "580",
  "code": "MNP",
  "name": "Northern Mariana Islands",
  "officialName": "Northern Mariana Islands",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "578",
  "code": "NOR",
  "name": "Norway",
  "officialName": "Norway",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "512",
  "code": "OMN",
  "name": "Oman",
  "officialName": "Oman",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "586",
  "code": "PAK",
  "name": "Pakistan",
  "officialName": "Pakistan",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "585",
  "code": "PLW",
  "name": "Palau",
  "officialName": "Palau",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "275",
  "code": "PSE",
  "name": "Palestine",
  "officialName": "State of Palestine",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "591",
  "code": "PAN",
  "name": "Panama",
  "officialName": "Panama",
  "unRegion": "Americas",
  "subregion": "Central America",
  "region": "North America"
 },
 {
  "id": "598",
  "code": "PNG",
  "name": "Papua New Guinea",
  "officialName": "Papua New Guinea",
  "unRegion": "Oceania",
  "subregion": "Melanesia",
  "region": "Oceania"
 },
 {
  "id": "600",
  "code": "PRY",
  "name": "Paraguay",
  "officialName": "Paraguay",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "604",
  "code": "PER",
  "name": "Peru",
  "officialName": "Peru",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "608",
  "code": "PHL",
  "name": "Philippines",
  "officialName": "Philippines",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "612",
  "code": "PCN",
  "name": "Pitcairn",
  "officialName": "Pitcairn",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "616",
  "code": "POL",
  "name": "Poland",
  "officialName": "Poland",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "620",
  "code": "PRT",
  "name": "Portugal",
  "officialName": "Portugal",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "630",
  "code": "PRI",
  "name": "Puerto Rico",
  "officialName": "Puerto Rico",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "634",
  "code": "QAT",
  "name": "Qatar",
  "officialName": "Qatar",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "642",
  "code": "ROU",
  "name": "Romania",
  "officialName": "Romania",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "643",
  "code": "RUS",
  "name": "Russia",
  "officialName": "Russian Federation",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "646",
  "code": "RWA",
  "name": "Rwanda",
  "officialName": "Rwanda",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "638",
  "code": "REU",
  "name": "Réunion",
  "officialName": "Réunion",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "652",
  "code": "BLM",
  "name": "Saint Barthélemy",
  "officialName": "Saint Barthélemy",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "654",
  "code": "SHN",
  "name": "Saint Helena",
  "officialName": "Saint Helena",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "659",
  "code": "KNA",
  "name": "Saint Kitts and Nevis",
  "officialName": "Saint Kitts and Nevis",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "662",
  "code": "LCA",
  "name": "Saint Lucia",
  "officialName": "Saint Lucia",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "663",
  "code": "MAF",
  "name": "Saint Martin (French Part)",
  "officialName": "Saint Martin (French Part)",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "666",
  "code": "SPM",
  "name": "Saint Pierre and Miquelon",
  "officialName": "Saint Pierre and Miquelon",
  "unRegion": "Americas",
  "subregion": "Northern America",
  "region": "North America"
 },
 {
  "id": "670",
  "code": "VCT",
  "name": "Saint Vincent and the Grenadines",
  "officialName": "Saint Vincent and the Grenadines",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "882",
  "code": "WSM",
  "name": "Samoa",
  "officialName": "Samoa",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "674",
  "code": "SMR",
  "name": "San Marino",
  "officialName": "San Marino",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "678",
  "code": "STP",
  "name": "Sao Tome and Principe",
  "officialName": "Sao Tome and Principe",
  "unRegion": "Africa",
  "subregion": "Middle Africa",
  "region": "Africa"
 },
 {
  "id": "682",
  "code": "SAU",
  "name": "Saudi Arabia",
  "officialName": "Saudi Arabia",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "686",
  "code": "SEN",
  "name": "Senegal",
  "officialName": "Senegal",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "688",
  "code": "SRB",
  "name": "Serbia",
  "officialName": "Serbia",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "690",
  "code": "SYC",
  "name": "Seychelles",
  "officialName": "Seychelles",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "694",
  "code": "SLE",
  "name": "Sierra Leone",
  "officialName": "Sierra Leone",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "702",
  "code": "SGP",
  "name": "Singapore",
  "officialName": "Singapore",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "534",
  "code": "SXM",
  "name": "Sint Maarten (Dutch part)",
  "officialName": "Sint Maarten (Dutch part)",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "703",
  "code": "SVK",
  "name": "Slovakia",
  "officialName": "Slovakia",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "705",
  "code": "SVN",
  "name": "Slovenia",
  "officialName": "Slovenia",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "090",
  "code": "SLB",
  "name": "Solomon Islands",
  "officialName": "Solomon Islands",
  "unRegion": "Oceania",
  "subregion": "Melanesia",
  "region": "Oceania"
 },
 {
  "id": "706",
  "code": "SOM",
  "name": "Somalia",
  "officialName": "Somalia",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "710",
  "code": "ZAF",
  "name": "South Africa",
  "officialName": "South Africa",
  "unRegion": "Africa",
  "subregion": "Southern Africa",
  "region": "Africa"
 },
 {
  "id": "239",
  "code": "SGS",
  "name": "South Georgia and the South Sandwich Islands",
  "officialName": "South Georgia and the South Sandwich Islands",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "410",
  "code": "KOR",
  "name": "South Korea",
  "officialName": "Republic of Korea",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "728",
  "code": "SSD",
  "name": "South Sudan",
  "officialName": "South Sudan",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "724",
  "code": "ESP",
  "name": "Spain",
  "officialName": "Spain",
  "unRegion": "Europe",
  "subregion": "Southern Europe",
  "region": "Europe"
 },
 {
  "id": "144",
  "code": "LKA",
  "name": "Sri Lanka",
  "officialName": "Sri Lanka",
  "unRegion": "Asia",
  "subregion": "Southern Asia",
  "region": "Asia"
 },
 {
  "id": "729",
  "code": "SDN",
  "name": "Sudan",
  "officialName": "Sudan",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "740",
  "code": "SUR",
  "name": "Suriname",
  "officialName": "Suriname",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "744",
  "code": "SJM",
  "name": "Svalbard and Jan Mayen Islands",
  "officialName": "Svalbard and Jan Mayen Islands",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "752",
  "code": "SWE",
  "name": "Sweden",
  "officialName": "Sweden",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "756",
  "code": "CHE",
  "name": "Switzerland",
  "officialName": "Switzerland",
  "unRegion": "Europe",
  "subregion": "Western Europe",
  "region": "Europe"
 },
 {
  "id": "760",
  "code": "SYR",
  "name": "Syria",
  "officialName": "Syrian Arab Republic",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "158",
  "code": null,
  "name": "Taiwan",
  "officialName": "Taiwan",
  "unRegion": "Asia",
  "subregion": "Eastern Asia",
  "region": "Asia"
 },
 {
  "id": "762",
  "code": "TJK",
  "name": "Tajikistan",
  "officialName": "Tajikistan",
  "unRegion": "Asia",
  "subregion": "Central Asia",
  "region": "Asia"
 },
 {
  "id": "834",
  "code": "TZA",
  "name": "Tanzania",
  "officialName": "United Republic of Tanzania",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "764",
  "code": "THA",
  "name": "Thailand",
  "officialName": "Thailand",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "626",
  "code": "TLS",
  "name": "Timor-Leste",
  "officialName": "Timor-Leste",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "768",
  "code": "TGO",
  "name": "Togo",
  "officialName": "Togo",
  "unRegion": "Africa",
  "subregion": "Western Africa",
  "region": "Africa"
 },
 {
  "id": "772",
  "code": "TKL",
  "name": "Tokelau",
  "officialName": "Tokelau",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "776",
  "code": "TON",
  "name": "Tonga",
  "officialName": "Tonga",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "780",
  "code": "TTO",
  "name": "Trinidad and Tobago",
  "officialName": "Trinidad and Tobago",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "788",
  "code": "TUN",
  "name": "Tunisia",
  "officialName": "Tunisia",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "795",
  "code": "TKM",
  "name": "Turkmenistan",
  "officialName": "Turkmenistan",
  "unRegion": "Asia",
  "subregion": "Central Asia",
  "region": "Asia"
 },
 {
  "id": "796",
  "code": "TCA",
  "name": "Turks and Caicos Islands",
  "officialName": "Turks and Caicos Islands",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "798",
  "code": "TUV",
  "name": "Tuvalu",
  "officialName": "Tuvalu",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "792",
  "code": "TUR",
  "name": "Türkiye",
  "officialName": "Türkiye",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Europe"
 },
 {
  "id": "800",
  "code": "UGA",
  "name": "Uganda",
  "officialName": "Uganda",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "804",
  "code": "UKR",
  "name": "Ukraine",
  "officialName": "Ukraine",
  "unRegion": "Europe",
  "subregion": "Eastern Europe",
  "region": "Europe"
 },
 {
  "id": "784",
  "code": "ARE",
  "name": "United Arab Emirates",
  "officialName": "United Arab Emirates",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "826",
  "code": "GBR",
  "name": "United Kingdom",
  "officialName": "United Kingdom of Great Britain and Northern Ireland",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 },
 {
  "id": "840",
  "code": "USA",
  "name": "United States",
  "officialName": "United States of America",
  "unRegion": "Americas",
  "subregion": "Northern America",
  "region": "North America"
 },
 {
  "id": "581",
  "code": "UMI",
  "name": "United States Minor Outlying Islands",
  "officialName": "United States Minor Outlying Islands",
  "unRegion": "Oceania",
  "subregion": "Micronesia",
  "region": "Oceania"
 },
 {
  "id": "850",
  "code": "VIR",
  "name": "United States Virgin Islands",
  "officialName": "United States Virgin Islands",
  "unRegion": "Americas",
  "subregion": "Caribbean",
  "region": "North America"
 },
 {
  "id": "858",
  "code": "URY",
  "name": "Uruguay",
  "officialName": "Uruguay",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "860",
  "code": "UZB",
  "name": "Uzbekistan",
  "officialName": "Uzbekistan",
  "unRegion": "Asia",
  "subregion": "Central Asia",
  "region": "Asia"
 },
 {
  "id": "548",
  "code": "VUT",
  "name": "Vanuatu",
  "officialName": "Vanuatu",
  "unRegion": "Oceania",
  "subregion": "Melanesia",
  "region": "Oceania"
 },
 {
  "id": "862",
  "code": "VEN",
  "name": "Venezuela",
  "officialName": "Venezuela (Bolivarian Republic of)",
  "unRegion": "Americas",
  "subregion": "South America",
  "region": "South America"
 },
 {
  "id": "704",
  "code": "VNM",
  "name": "Vietnam",
  "officialName": "Viet Nam",
  "unRegion": "Asia",
  "subregion": "South-eastern Asia",
  "region": "Asia"
 },
 {
  "id": "876",
  "code": "WLF",
  "name": "Wallis and Futuna Islands",
  "officialName": "Wallis and Futuna Islands",
  "unRegion": "Oceania",
  "subregion": "Polynesia",
  "region": "Oceania"
 },
 {
  "id": "732",
  "code": "ESH",
  "name": "Western Sahara",
  "officialName": "Western Sahara",
  "unRegion": "Africa",
  "subregion": "Northern Africa",
  "region": "Africa"
 },
 {
  "id": "887",
  "code": "YEM",
  "name": "Yemen",
  "officialName": "Yemen",
  "unRegion": "Asia",
  "subregion": "Western Asia",
  "region": "Middle East"
 },
 {
  "id": "894",
  "code": "ZMB",
  "name": "Zambia",
  "officialName": "Zambia",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "716",
  "code": "ZWE",
  "name": "Zimbabwe",
  "officialName": "Zimbabwe",
  "unRegion": "Africa",
  "subregion": "Eastern Africa",
  "region": "Africa"
 },
 {
  "id": "248",
  "code": "ALA",
  "name": "Åland Islands",
  "officialName": "Åland Islands",
  "unRegion": "Europe",
  "subregion": "Northern Europe",
  "region": "Europe"
 }
];
const normalizeCountry=value=>String(value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const countryByName=new Map(COUNTRIES.flatMap(c=>[c.name,c.officialName,c.code,c.id].filter(Boolean).map(name=>[normalizeCountry(name),c])));
const aliases={uk:'GBR',britain:'GBR','great britain':'GBR',us:'USA',usa:'USA',uae:'ARE',turkey:'TUR','czech republic':'CZE','ivory coast':'CIV','cape verde':'CPV','east timor':'TLS','burma':'MMR','south korea':'KOR','north korea':'PRK','vatican city':'VAT','hong kong':'HKG',macao:'MAC',macau:'MAC',taiwan:'158',kosovo:'412'};
export function findCountry(value){const key=normalizeCountry(value);return countryByName.get(key)||countryByName.get(normalizeCountry(aliases[key]));}
export function departureContext(value){const country=findCountry(value);return {homeCountry:country?.name||'',homeRegion:country?.region||'all'};}
export function sameCountry(a,b){const x=findCountry(a),y=findCountry(b);return !!x&&!!y&&x.id===y.id;}
