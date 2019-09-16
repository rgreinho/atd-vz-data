import React, { useState, useEffect } from "react";
import { withApollo } from "react-apollo";
import {
  Col,
  Button,
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButtonDropdown,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
  Alert,
} from "reactstrap";

// TODO add query operators to each field to better fit data types (_eq, etc.)?
const GridTableSearch = ({ query, clearFilters, setSearchParameters, resetPage }) => {
  const [searchFieldValue, setSearchFieldValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fieldToSearch, setFieldToSearch] = useState("");
  const [isFieldSelected, setIsFieldSelected] = useState(false);

  const fieldsToSearch = query.searchableFields;

  /**
   * Handles the submission of our search form
   * @param {object} e - the event object
   */
  const handleSearchSubmission = e => {
    e.preventDefault();

    setSearchParameters({
      column: fieldToSearch,
      value: searchFieldValue,
    });

    resetPage();
  };

  /**
   * Clears the search results
   */
  const handleClearSearchResults = () => {
    clearFilters();
    setSearchFieldValue("");
    setFieldToSearch("");
    setIsFieldSelected(false);
  };

  /**
   * Toggles the dropdown options
   */
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  /**
   * Handles the selection of our search mode in the dropdown
   * @param {object} e - the event object
   */
  const handleFieldSelect = e => {
    setIsFieldSelected(true);
    setFieldToSearch(e.target.value);
  };

  /**
   * Returns a human-readable label for a specific column
   * @param {string} fieldKey - the raw column name from the database
   * @returns {string}
   */
  const getFieldName = fieldKey => {
    return query.getLabel(fieldKey, "search");
  };

  return (
    <Form className="form-horizontal" onSubmit={handleSearchSubmission}>
      {!isFieldSelected && searchFieldValue && (
        <Alert color="warning">Please provide a field to search.</Alert>
      )}
      <FormGroup row>
        <Col md="6">
          <InputGroup>
            <Input
              type="text"
              id="input1-group2"
              name="input1-group2"
              placeholder={"Enter Search Here..."}
              value={searchFieldValue}
              onChange={e => setSearchFieldValue(e.target.value)}
            />
            <InputGroupButtonDropdown
              addonType="prepend"
              isOpen={isDropdownOpen}
              toggle={toggleDropdown}
            >
              <DropdownToggle caret color="secondary">
                {fieldToSearch === "" ? "Field" : getFieldName(fieldToSearch)}
              </DropdownToggle>
              <DropdownMenu>
                {fieldsToSearch.map((field, i) => (
                  <DropdownItem
                    key={i}
                    value={field}
                    onClick={handleFieldSelect}
                  >
                    {getFieldName(field)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </InputGroupButtonDropdown>
            <InputGroupAddon addonType="append">
              <Button type="submit" color="primary">
                <i className="fa fa-search" /> Search
              </Button>
              <Button
                type="button"
                color="danger"
                onClick={handleClearSearchResults}
              >
                <i className="fa fa-ban" /> Clear
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Col>
      </FormGroup>
    </Form>
  );
};

export default withApollo(GridTableSearch);