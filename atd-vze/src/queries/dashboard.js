import { gql } from "apollo-boost";

export const GET_CRASHES_YTD = gql`
  query GetCrashesYTD($yearStart: date, $yearEnd: date) {
    fatalities: atd_txdot_crashes_aggregate(
      where: {
        city_id: { _eq: 22 }
        crash_date: { _gte: $yearStart, _lte: $yearEnd }
        private_dr_fl: { _neq: "Y" }
        apd_confirmed_fatality: { _neq: "N" }
      }
    ) {
      aggregate {
        sum {
          apd_confirmed_death_count
        }
      }
    }
    seriousInjuriesAndTotal: atd_txdot_crashes_aggregate(
      where: {
        city_id: { _eq: 22 }
        crash_date: { _gte: $yearStart, _lte: $yearEnd }
        private_dr_fl: { _neq: "Y" }
      }
    ) {
      aggregate {
        count
        sum {
          sus_serious_injry_cnt
        }
      }
    }
    atd_txdot_person_aggregate(
      where: {
        injury_severity: { injry_sev_desc: { _eq: "KILLED" } }
        crash: {
          city_id: { _eq: 22 }
          crash_date: { _gte: $yearStart, _lte: $yearEnd }
          apd_confirmed_fatality: { _neq: "N" }
        }
      }
    ) {
      aggregate {
        sum {
          years_of_life_lost
        }
      }
    }
    atd_txdot_primaryperson_aggregate(
      where: {
        injury_severity: { injry_sev_desc: { _eq: "KILLED" } }
        crash: {
          city_id: { _eq: 22 }
          crash_date: { _gte: $yearStart, _lte: $yearEnd }
          apd_confirmed_fatality: { _neq: "N" }
        }
      }
    ) {
      aggregate {
        sum {
          years_of_life_lost
        }
      }
    }
  }
`;
