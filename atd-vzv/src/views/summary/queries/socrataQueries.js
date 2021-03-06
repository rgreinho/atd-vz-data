import { isDevelopment } from "../../../constants/nav";

const crashDatasetID = isDevelopment ? "3aut-fhzp" : "y2wy-tgr5";
const personDatasetID = isDevelopment ? "v3x4-fjgm" : "xecs-rpy9";

export const crashEndpointUrl = `https://data.austintexas.gov/resource/${crashDatasetID}.json`;
export const crashGeoJSONEndpointUrl = `https://data.austintexas.gov/resource/${crashDatasetID}.geojson`;
export const personEndpointUrl = `https://data.austintexas.gov/resource/${personDatasetID}.json`;
