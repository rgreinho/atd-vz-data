"""
Socrata Queries
Author: Austin Transportation Department, Data & Technology Services

Description: The purpose of this script is to define graphql query templates
to run against the Hasura endpoint for Socrata upsertion.

Important: These templates require importing the Template class from the string library.
"""
from string import Template

# Queries Hasura to retrieve records for
# https://data.austintexas.gov/d/y2wy-tgr5
crashes_query_template = Template(
    """
    query getCrashesSocrata {
        atd_txdot_crashes (limit: $limit, offset: $offset, order_by: {crash_id: asc}, where: {city_id: {_eq: 22}}) {
            apd_confirmed_fatality
            apd_confirmed_death_count
            crash_id
            crash_fatal_fl
            crash_date
            crash_time
            case_id
            onsys_fl
            private_dr_fl
            rpt_latitude
            rpt_longitude
            rpt_block_num
            rpt_street_pfx
            rpt_street_name
            rpt_street_sfx
            crash_speed_limit
            road_constr_zone_fl
            latitude_primary
            longitude_primary
            street_name
            street_nbr
            street_name_2
            street_nbr_2
            crash_sev_id
            sus_serious_injry_cnt
            nonincap_injry_cnt
            poss_injry_cnt
            non_injry_cnt
            unkn_injry_cnt
            tot_injry_cnt
            death_cnt
            atd_mode_category_metadata
            units {
                contrib_factr_p1_id
                contrib_factr_p2_id
            }
        }
    }
"""
)

# Queries Hasura to retrieve records for
# https://data.austintexas.gov/d/xecs-rpy9
people_query_template = Template(
    """
    query getPeopleSocrata {
        atd_txdot_person(limit: $limit, offset: $offset, order_by: {person_id: asc}, where: {_or: [{prsn_injry_sev_id: {_eq: 1}}, {prsn_injry_sev_id: {_eq: 4}}], _and: {crash: {city_id: {_eq: 22}}}}) {
            person_id
            prsn_injry_sev_id
            prsn_age
            prsn_gndr_id
            prsn_ethnicity_id
            unit_nbr
            crash {
                crash_date
                atd_mode_category_metadata
                units {
                    unit_nbr
                    unit_id
                }
            }
        }
        atd_txdot_primaryperson(limit: $limit, offset: $offset, order_by: {primaryperson_id: asc}, where: {_or: [{prsn_injry_sev_id: {_eq: 1}}, {prsn_injry_sev_id: {_eq: 4}}], _and: {crash: {city_id: {_eq: 22}}}}) {
            primaryperson_id
            prsn_injry_sev_id
            prsn_age
            prsn_gndr_id
            prsn_ethnicity_id
            unit_nbr
            crash {
                crash_date
                atd_mode_category_metadata
                units {
                    unit_nbr
                    unit_id
                }
            }
        }
    }
"""
)
