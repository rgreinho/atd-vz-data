"""
Helpers for Socrata Export
Author: Austin Transportation Department, Data & Technology Services

Description: This script contains methods that help in the download
of records from Hasura and upserting into an existing Socrata data table.

The application requires the requests and sodapy libraries:
    https://pypi.org/project/requests/
    https://pypi.org/project/sodapy/
"""

import requests
import json
from copy import deepcopy
from process.config import ATD_ETL_CONFIG


def replace_chars(target_str, char_list, replacement_str):
    """
    Replaces characters in a given string with a given string
    :param target_str: string - String needing character replacement
    :param char_list: list - List of characters to be replaced
    :param replacement_str: string - String to replace given characters
    """
    for char in char_list:
        target_str = target_str.replace(char, replacement_str)
    return target_str


def run_hasura_query(query):
    """
    Queries Hasura and returns the response
    :param query: string - The GraphQL query to post
    """
    # Build Header with Admin Secret
    headers = {
        "x-hasura-admin-secret": ATD_ETL_CONFIG["HASURA_ADMIN_KEY"]
    }

   # Try making insertion
    try:
        return requests.post(ATD_ETL_CONFIG["HASURA_ENDPOINT"],
                             json={'query': query},
                             headers=headers).json()
    except Exception as e:
        print("Exception, could not insert: " + str(e))
        print("Query: '%s'" % query)
        return None


def flatten_hasura_response(records):
    """
    Flattens data response from Hasura
    :param records: list - List of record dicts
    """
    formatted_records = []
    for record in records:
        # Create copy of record to mutate
        formatted_record = deepcopy(record)
        # Look through key values for nested data structures
        for first_level_key, first_level_value in record.items():
            # If list is found, iterate to bring key values to top-level
            if type(first_level_value) == list:
                for item in first_level_value:
                    for second_level_key, second_level_value in item.items():
                        # Handle nested values
                        if type(second_level_value) == dict:
                            # Handles concat of values here
                            for third_level_key, third_level_value in second_level_value.items():
                                if third_level_key in formatted_record.keys():
                                    # If key already exists at top-level, concat with existing values
                                    next_record = f" & {third_level_value}"
                                    formatted_record[third_level_key] = formatted_record[third_level_key] + next_record
                                else:
                                    # Create key at top-level
                                    formatted_record[third_level_key] = third_level_value
                        # Copy non-nested key-values to top-level (if value is not null)
                        # Null records can create unwanted columns at top level of record
                        elif second_level_value is not None:
                            formatted_record[second_level_key] = second_level_value
                # Remove key with values that were moved to top-level
                del formatted_record[first_level_key]
            # If dict is found, iterate to bring key values to top-level
            elif type(first_level_value) == dict:
                for dict_key, dict_value in first_level_value.items():
                    formatted_record[dict_key] = dict_value
                del formatted_record[first_level_key]
        formatted_records.append(formatted_record)
    return formatted_records


def set_mode_columns(records):
    """
    Stringify atd_mode_category_metadata and concat mode descriptions
    :param records: list - List of record dicts
    """
    formatted_records = []
    for record in records:
        # Create copy of record to mutate
        formatted_record = deepcopy(record)
        metadata_column = "atd_mode_category_metadata"
        if metadata_column in record.keys() and record[metadata_column] != None:
            # Concat mode_desc strings for all units
            units_involved = []
            for unit in record[metadata_column]:
                units_involved.append(unit.get("mode_desc"))
            formatted_record["units_involved"] = " & ".join(units_involved)

            # Stringify metadata
            formatted_record[metadata_column] = json.dumps(
                record[metadata_column])
        formatted_records.append(formatted_record)
    return formatted_records


def create_point_datatype(records):
    """
    Creates point datatype to enable fetching GeoJSON from Socrata
    :param records: list - List of record dicts
    """
    for record in records:
        latitude = record['latitude']
        longitude = record['longitude']
        # Socrata rejects point upserts with no lat/lon
        if latitude != None and longitude != None:
            record["point"] = f"POINT ({longitude} {latitude})"
    return records


def rename_record_columns(records, columns_to_rename):
    """
    Renames columns for better desc and to match Socrata column names
    :param records: list - List of record dicts
    :param columns_to_rename: dict - Dict of Hasura columns and matching Socrata columns
    """
    for record in records:
        for column, rename_value in columns_to_rename.items():
            if column in record.keys():
                record[rename_value] = record.pop(column)
    return records


def add_value_prefix(records, prefix_dict):
    """
    Prefixes a record value
    :param records: list - List of record dicts
    :param prefix_dict: dict - Dict of columns and prefixes to add to values
    """
    for record in records:
        for prefix_key, prefix_value in prefix_dict.items():
            if prefix_key in record.keys():
                record[prefix_key] = prefix_value + str(record[prefix_key])
    return records


def set_person_mode(records):
    """
    Sets mode of person from crash record metadata
    Person (unit_nbr) => Units (unit_nbr & unit_id) => Crash metadata (unit_id)
    :param records: list - List of record dicts
    """
    for record in records:
        # Gather person, unit, and crash data
        person_unit_number = record.get("unit_nbr")
        crash = record.get("crash")
        units = crash.get("units", [])

        # Find unit_id
        unit_id = ""
        for unit in units:
            if unit.get("unit_nbr") == person_unit_number:
                unit_id = unit.get("unit_id")

        # Find unit in metadata and set mode_desc and mode_id columns
        crash_metadata = crash.get("atd_mode_category_metadata", [])
        if crash_metadata != None:
            for unit in crash_metadata:
                if unit.get("unit_id") == unit_id:
                    record["mode_desc"] = unit.get("mode_desc")
                    record["mode_id"] = unit.get("mode_id")
        del record["crash"]["units"]
        del record["crash"]["atd_mode_category_metadata"]
        del record["unit_nbr"]
    return records


def format_crash_data(data, formatter_config):
    """
    Prepares crash data for Socrata upsertion
    :param data: dict - Dict containing list of Hasura records
    :param formatter_config: dict - Dict containing config for data formatting
    """
    records = data['data'][formatter_config["tables"][0]]

    # Format records
    formatted_records = set_mode_columns(
        records)
    formatted_records = flatten_hasura_response(formatted_records)
    formatted_records = rename_record_columns(
        formatted_records, formatter_config["columns_to_rename"])
    formatted_records = create_point_datatype(formatted_records)

    return formatted_records


def format_person_data(data, formatter_config):
    """
    Prepares person data for Socrata upsertion
    :param data: dict - Dict containing list of Hasura records
    :param formatter_config: dict - Dict containing config for data formatting
    """
    person_records = data['data'][formatter_config["tables"][0]]
    primary_person_records = data['data'][formatter_config["tables"][1]]

    # Make record IDs unique by adding prefixes and set mode of person
    person_records = add_value_prefix(
        person_records, formatter_config["prefixes"])
    person_records = set_person_mode(
        person_records)
    primary_person_records = add_value_prefix(
        primary_person_records, formatter_config["prefixes"])
    primary_person_records = set_person_mode(
        primary_person_records)

    # Join records and format
    people_records = person_records + primary_person_records
    formatted_records = rename_record_columns(
        people_records, formatter_config["columns_to_rename"])
    formatted_records = flatten_hasura_response(
        formatted_records)
    for record in formatted_records:
        print(record)
    return formatted_records
