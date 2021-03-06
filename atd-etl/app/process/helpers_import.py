"""
Helper Methods
Author: Austin Transportation Department, Data and Technology Services

Description: The purpose of this script is to provide any methods that
assist any script associated to this application.
"""

import sys
import glob
import csv
import io
import json
import re
import datetime
import web_pdb

# Dependencies
from .queries import search_crash_query, search_crash_query_full
from .request import run_query
from .helpers_import_fields import CRIS_TXDOT_FIELDS, CRIS_TXDOT_COMPARE_FIELDS_LIST


def generate_template(name, function, fields):
    """
    Returns a string with a graphql template
    :param name:
    :param function:
    :param fields:
    :return:
    """
    return """
        mutation %NAME% {
          %FUNCTION%(
            objects: {
            %FIELDS%
            }
          ){
            affected_rows
          }
        }
    """.replace("%NAME%", name)\
        .replace("%FUNCTION%", function)\
        .replace("%FIELDS%", fields)


def lowercase_group_match(match):
    """
    Return the lowercase of a group match.
    :param match: raw string of the group match
    :return: string in lower case
    """
    return "%s:" % match.group(1).lower()


def generate_fields_with_filters(line, fieldnames, filters=[]):
    """
    Generates a list of fields for graphql query
    :param line: string - The raw csv line
    :param fieldnames: array of strings - The fields to be used as headers
    :param filters: dict - The filters to be applied
    :return:
    """
    reader = csv.DictReader(f=io.StringIO(line), fieldnames=fieldnames, delimiter=',') # parse line
    fields = json.dumps([row for row in reader]) # Generate json

    # Remove object characters
    fields = fields.replace("[{", "").replace("}]", "")
    # Lowercase the keys
    fields = re.sub(r'"([a-zA-Z0-9_]+)":', lowercase_group_match, fields)

    # Make empty strings null
    fields = re.sub(r'([a-zA-Z0-9_]+): "",', r'\1: null,', fields)

    # Break lines & remove ending commas
    fields = re.sub(r'(\, )(([^"]+)(: ?)(\")([^"]+)(\"))', r'\n\2', fields)
    fields = re.sub(r'(null, )([a-zA-Z0-9\_]+)', r'null\n\2', fields)
    fields = re.sub(r'(, )([a-zA-Z0-9\_]+)(: null)', r'\n\2: null', fields)

    # Apply filters
    for filter_group in filters:

        filter_function = filter_group[0]
        filter_function_arguments = filter_group[1]

        try:
            fields_copy = fields
            fields = filter_function(input=fields, fields=filter_function_arguments)
        except Exception as e:
            print("Error when applying filter: %s" % str(e))

    return fields


def get_crash_id(line):
    """
    Takes a raw CSV line and returns a crash_id
    :param line: string - The raw CSV line
    :return: string - The Crash ID
    """
    try:
        return line.strip().split(",")[0]
    except Exception as e:
        print("Error: " + str(e))
        return ""


def generate_gql(line, fieldnames, file_type):
    """
    Returns a string with the final graphql query
    :param line: string - The raw csv line
    :param fieldnames: array of strings - The name of fields
    :param file_type: string - the type of insertion (crash, units, etc...)
    :return:
    """

    filters = CRIS_TXDOT_FIELDS[file_type]["filters"]
    query_name = CRIS_TXDOT_FIELDS[file_type]["query_name"]
    function_name = CRIS_TXDOT_FIELDS[file_type]["function_name"]

    try:
        fields = generate_fields_with_filters(line=line,
                                              fieldnames=fieldnames,
                                              filters=filters)

        template = generate_template(name=query_name,
                                     function=function_name,
                                     fields=fields)
    except Exception as e:
        print("generate_gql() Error: " + str(e))
        template = ""

    return template


def record_exists_hook(line, file_type):
    """
    Returns True if the record already exists, False if it cannot find it.
    :param line: string - The raw record in CSV format
    :param file_type: string - The parameter as passed to the terminal
    :return: boolean - True if the record exists, False otherwise.
    """

    # If the record type is a crash:
    if file_type == "crash":
        """
            Approach: 
                - Crashes:
                    1. Checks if the crash is already there
                    2. If the crash does not exist then returns False
                    3. Script will attempt to insert
                - Others:
                    - Assume the record isn't there.
                    - Let fail at insertion.
        """
        crash_id = get_crash_id(line)
        query = search_crash_query(crash_id)

        try:
            result = run_query(query)
            return len(result["data"]["atd_txdot_crashes"]) > 0
        except Exception as e:
            print("record_exists_hook() Error: " + str(e))
            return True

    # Any other record types just assume false.
    # In the future we may want to write a function that
    # performs searches.
    return False


def handle_record_error_hook(line, gql, file_type, response={}, line_number="n\a"):
    """
    Returns true to stop the execution of this script, false to mark as a non-error and move on.
    :param line: string - the csv line being processed
    :param gql: string - the graphql query that was at fault
    :param file_type: string - the type of record being processed
    :param response: dict - The json response from the request output
    :param line_number: string - The line number where the error occurs
    :return: bool - True to signal error and stop execution, False otherwise.
    """

    # If this is a crash, we want to know why it didn't insert, so we need to stop.
    if file_type == "crash":
        print(gql)
        return True

    # If not a crash, we are not interested to know what happened. Move on to next one.
    # This is because the other records do not have a primary key, so to avoid duplicates
    # we rely on unique indexes. So if a duplicate record tries to insert, it just fails.
    # So there is no need to stop the rest of the execution.
    else:
        # We must ignore constraint-violation errors,
        # it means we are trying to overwrite a record.
        if "constraint-violation" in str(response):
            return False
        # Otherwise, this could be a legitimate problem,
        # for which we must stop the execution
        else:
            print("""\n\n------------------------------------------
Fatal Error
-----------------------------------------
Line:   \t%s 
CrashID:\t%s
Line:   \t%s
Type:   \t%s \n
Query:  \t%s \n
Response: %s \n
------------------------------------------\n\n
            """ % (
                line_number,
                get_crash_id(line),
                str(line).strip(), file_type, gql,
                str(response)
            ))
            return True


def get_file_list(file_type):
    """
    Returns a list of all files to be processed
    :param file_type: string - The type to be used: crash, charges, person, primaryperson, unit
    :return: array
    """
    return glob.glob("/data/extract_*_%s_*.csv" % file_type)


def generate_run_config():
    """
    It takes the arguments passed to the python script and it generates
    a configuration json dictionary with a list of all csv files to process
    and the number of lines to skip per file.
    :return: dict
    """

    # Our dictionary template
    config = {
        "file_dryrun": False,
        "file_type": "",
        "file_list_raw": [],
        "skip_rows_raw": []
    }

    # First we try to get the file type from the 1st argument
    try:
        config["file_type"] = str(sys.argv[1]).lower()
    except:
        # Or force quit, we really need it.
        print("No file type provided")
        exit(1)

    # Gather a skip rows expressions
    try:
        sr_expression = str(sys.argv[2]).lower()
        config["skip_rows_raw"] = sr_expression.split(",")
    except:
        config["skip_rows_raw"] = []

    # We need to determine if this is a dry-run
    try:
        if "--dryrun" in sys.argv:
            config["file_dryrun"] = True
        else:
            config["file_dryrun"] = False
    except:
        config["file_dryrun"] = False
        print("Dry-run not defined, assuming running without dry-run mode.")

    # Gather the list of files
    config["file_list_raw"] = get_file_list(file_type=config["file_type"])

    # Final list placeholder
    finalFileList = []

    # For every file in the list
    for i in range(0, len(config["file_list_raw"])):
        # Get the file path
        file = config["file_list_raw"][i]

        try:
            # Try reading the number of lines in different array
            # or assume zero on exception.
            skip_lines_string = config["skip_rows_raw"][i]

            # If this is a star, signal we are going to skip all lines.
            if skip_lines_string == "*":
                skip_lines_string = "-1"

            # Parse string number into actual integer
            skip_lines_value = int(skip_lines_string)
        except:
            # On failure assume zero
            skip_lines_value = 0

        # Append a mini-dictionary into the finalFileList
        finalFileList.append({
            "file": file,
            "skip": skip_lines_value
        })

    # Assign to the final template the finalFileList array of dictionaries
    config["file_list"] = finalFileList

    # Return the config
    return config


def get_crash_record(crash_id):
    """
    Obtains a single crash record based on the crash_id
    :param crash_id: string - The crash id to obtain from the database
    :return: string
    """
    # First generate a query with a list of the columns we care about
    query = search_crash_query_full(crash_id=crash_id,
                                    field_list=CRIS_TXDOT_COMPARE_FIELDS_LIST)

    # Then try to run the query to get the actual record
    try:
        result = run_query(query)
        return result["data"]["atd_txdot_crashes"][0]

    except Exception as e:
        print("There was a problem getting crash_id: %s\n%s" % (crash_id, str(e)))
        return None


def is_cris_date(string):
    """
    Returns True if the string is a date in mm/dd/yyyy format, False otherwise.
    :param string: string - The string being evaluated
    :return: boolean
    """
    return bool(re.match(r'(\d{2})\/(\d{2})\/(\d{4})', string))


def is_cris_time(string):
    """
    Returns True if string has a hh:mm (AM|PM) time format, returns False otherwise.
    :param string:
    :return:
    """
    return bool(re.match(r'(\d{2}):(\d{2}) (AM|PM)', string))


def convert_date(string):
    """
    Turns a mm/dd/yyyy date into a yyyy-mm-dd date.
    :param string: string - The date being converted
    :return: string
    """
    input_date = datetime.datetime.strptime(string, "%m/%d/%Y")
    return input_date.strftime("%Y-%m-%d")


def convert_time(string):
    """
    Converts a time string from a 12 hour format, to a 24 hour format
    :param string: string - The string being converted
    :return: string
    """
    input_time = datetime.datetime.strptime(string, "%I:%M %p")
    return input_time.strftime("%H:%M:00")


def clean_none_null(string):
    """
    Removes 'None' and 'null' from string
    :param string: string - The string being evaluated
    :return: string
    """
    return str(string).replace("None", "").replace("null", "")


def record_compare(record_new, record_existing):
    """
    Compares two dictionaries. It uses the CRIS_TXDOT_COMPARE_FIELDS_LIST
    to determine what fields are important enough, and returns True if
    there is one important difference. Returns False if none of the fields
    present any differences.
    :param record_new: dict - The new object being parsed from csv
    :param record_existing: dict - The existing object, as parsed from an HTTP query
    :return: bool
    """
    for field in CRIS_TXDOT_COMPARE_FIELDS_LIST:
        # Remove None and null
        record_existing[field] = clean_none_null(record_existing[field])

        # If the current field is a date, then try to parse it
        if is_cris_date(record_new[field]):
            record_new[field] = convert_date(record_new[field])

        # If the current field is a time string, then try to parse it
        if is_cris_time(record_new[field]):
            record_new[field] = convert_time(record_new[field])

        # Make the comparison, if not equal important_difference = true
        important_difference = record_new[field] != record_existing[field]

        if important_difference:
            return True

    # Found no differences in any of the fields
    return False


def generate_crash_record(line, fieldnames):
    """
    Translates a raw csv line into a python dictionary
    :param line: string - The raw csv line
    :param fieldnames: array of strings - The strings to be used as headers
    :return: dict
    """
    reader = csv.DictReader(f=io.StringIO(line), fieldnames=fieldnames, delimiter=',')  # parse line
    fields = json.dumps([row for row in reader])  # Generate json
    # Remove object characters
    fields = fields.replace("[", "").replace("]", "")
    # Return a dictionary
    return json.loads(fields)


def insert_crash_change_template(new_record_dict):
    """
    Generates a crash insertion graphql query
    :param new_record_dict: dict - The new record as a dictionary
    :return: string
    """
    # Turn the dictionary into a character-escaped json string
    new_record_escaped = json.dumps(new_record_dict).replace("\"", "\\\"")
    # Build the template and inject required values
    return """
        mutation insertCrashChangeMutation {
      insert_atd_txdot_changes(objects: {
        record_id: NEW_RECORD_ID,
        record_json: "NEW_RECORD_ESCAPED_JSON",
        record_type: "crash",
        updated_by: "System"
      }) {
        affected_rows
      }
    }
    """.replace("NEW_RECORD_ESCAPED_JSON", new_record_escaped)\
        .replace("NEW_RECORD_ID", new_record_dict["crash_id"])


def record_compare_hook(line, fieldnames, file_type):
    """
    Hook that finds an existing record, and compares it with a new incoming record built from a raw csv line.
    :param line: string - The raw csv line
    :param fieldnames: array of strings - The strings to be used as headers
    :param file_type: string - The file type (crash, units, charges, etc...)
    :return:
    """
    if file_type == "crash":
        fieldnames = [column.lower() for column in fieldnames]
        crash_id = get_crash_id(line)
        record_new = generate_crash_record(line=line, fieldnames=fieldnames)
        record_existing = get_crash_record(get_crash_id(line))
        significant_difference = record_compare(record_new=record_new, record_existing=record_existing)
        if significant_difference:
            mutation_template = insert_crash_change_template(new_record_dict=record_new)
            result = run_query(mutation_template)
            try:
                affected_rows = result["data"]["insert_atd_txdot_changes"]["affected_rows"]
            except:
                affected_rows = 0

            if affected_rows == 1:
                print("Crash Review Request Inserted: %s" % (crash_id))
            else:
                print("Failed to insert crash review request: %s" % crash_id)
