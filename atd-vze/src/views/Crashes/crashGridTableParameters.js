export const crashGridTableColumns = {
  crash_id: {
    primary_key: true,
    searchable: true,
    sortable: true,
    label_search: "Search by Crash ID",
    label_table: "Crash ID",
    type: "Int",
  },
  case_id: {
    searchable: true,
    sortable: true,
    label_search: "Search by Case Number",
    label_table: "Case Number",
    type: "String",
  },
  crash_date: {
    searchable: false,
    sortable: true,
    label_table: "Crash Date",
    type: "Date",
  },
  address_confirmed_primary: {
    searchable: true,
    sortable: true,
    label_search: "Search by Primary Address",
    label_table: "Primary Address",
    type: "String",
  },
  address_confirmed_secondary: {
    searchable: true,
    sortable: true,
    label_search: "Search by Secondary Address",
    label_table: "Secondary Address",
    type: "String",
  },
  sus_serious_injry_cnt: {
    searchable: false,
    sortable: true,
    label_table: "Serious Injury Count",
    type: "Int",
  },
  death_cnt: {
    searchable: false,
    sortable: true,
    label_table: "CRIS Death Count",
    type: "Date",
  },
  "collision { collsn_desc } ": {
    searchable: false,
    sortable: false,
    label_table: "Collision Description",
    type: "String",
  },
  "units { unit_description { veh_unit_desc_desc } }": {
    searchable: false,
    sortable: false,
    label_table: "Unit Description",
    type: "String",
  },
  "geocode_method { name }": {
    searchable: false,
    sortable: true,
    label_table: "Geocode Provider",
    type: "String",
  },
};

export const nonCR3CrashGridTableColumns = {
  form_id: {
    primary_key: false, // We say no here bc there is no page to link to
    searchable: true,
    sortable: true,
    label_search: "Search by Crash Form ID",
    label_table: "Crash Form ID",
    type: "Int",
  },
  date: {
    primary_key: false,
    searchable: false,
    sortable: true,
    label_table: "Date",
    type: "Date",
  },
  hour: {
    primary_key: false,
    searchable: false,
    sortable: false,
    label_table: "Hour of Day",
    type: "Int",
  },
  address: {
    primary_key: false,
    searchable: false,
    sortable: true,
    label_search: "Search by Address",
    label_table: "Address",
    type: "String",
  },
  speed_mgmt_points: {
    primary_key: false,
    searchable: false,
    sortable: true,
    label_table: "Speed Management Points",
    type: "Int",
  },
  est_comp_cost: {
    primary_key: false,
    searchable: false,
    sortable: true,
    label_table: "Est Comprehensive Cost",
    type: "Int",
  },
  est_econ_cost: {
    primary_key: false,
    searchable: false,
    sortable: true,
    label_table: "Est Economic Cost",
    type: "Int",
  },
};

export const crashGridTableAdvancedFilters = {
  groupInjuries: {
    icon: "cab",
    label: "Deaths & Injuries",
    filters: [
      {
        id: "dni_cris_deaths",
        label: "CRIS Fatality Crashes",
        filter: {
          where: [{ or: { death_cnt: "_gt: 0" } }],
        },
      },
      {
        id: "dni_apd_deaths",
        label: "APD Confirmed Fatality Crashes",
        filter: {
          where: [{ or: { apd_confirmed_death_count: "_gt: 0" } }],
        },
      },
      {
        id: "dni_serious_injuries",
        label: "Serious Injury Crashes",
        filter: {
          where: [{ or: { sus_serious_injry_cnt: "_gt: 0" } }],
        },
      },
      {
        id: "dni_non_fatal",
        label: "Non-serious Injury Crashes",
        filter: {
          where: [{ or: { nonincap_injry_cnt: "_gt: 0" } }],
        },
      },
    ],
  },
  groupGeography: {
    icon: "map-marker",
    label: "Geography",
    filters: [
      {
        id: "geo_no_coordinates",
        label: "No Primary Coordinates",
        filter: {
          where: [
            { latitude_primary: "_is_null: true" },
            { longitude_primary: "_is_null: true" },
          ],
        },
      },
      {
        id: "geo_geocoded",
        label: "Has been Geocoded",
        filter: {
          where: [{ geocoded: '_eq: "Y"' }],
        },
      },
      {
        id: "geo_confirmed_coordinates",
        label: "No CRIS Coordinates",
        filter: {
          where: [
            { latitude: "_is_null: true" },
            { longitude: "_is_null: true" },
          ],
        },
      },
    ],
  },
  groupUnitTypes: {
    icon: "bicycle",
    label: "Units Involved",
    filters: [
      {
        id: "pedestrian",
        label: "Pedestrian Involved",
        filter: {
          where: [
            {
              'units: { unit_description: { veh_unit_desc_desc: { _eq: "PEDESTRIAN" } } }': null,
            },
          ],
        },
      },
      {
        id: "pedacyclist",
        label: "Cyclist Involved",
        filter: {
          where: [
            {
              'units: { unit_description: { veh_unit_desc_desc: { _eq: "PEDALCYCLIST" } } }': null,
            },
          ],
        },
      },
      {
        id: "motorized_conveyance",
        label: "Motorized Conveyance Involved",
        filter: {
          where: [
            {
              'units: { unit_description: { veh_unit_desc_desc: { _eq: "MOTORIZED CONVEYANCE" } } }': null,
            },
          ],
        },
      },
    ],
  },
  groupCase: {
    icon: "vcard-o",
    label: "Internal",
    filters: [
      {
        id: "int_nocasenumber",
        label: "No Case Number",
        filter: {
          where: [{ case_id: "_is_null: true" }],
        },
      },
      {
        id: "int_excludeprivdrive",
        label: "Exclude Private Driveway Crashes",
        filter: {
          where: [{ private_dr_fl: '_neq: "Y"' }],
        },
      },
    ],
  },
};
