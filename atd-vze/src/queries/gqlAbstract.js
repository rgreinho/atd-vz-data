import { gql } from "apollo-boost";

class gqlAbstract {
  /**
   * Primes the internal configuration for rendering.
   *
   * @constructor
   * @param {Object} The initial configuration of the abstract
   */
  constructor(initConfig) {
    this.config = initConfig;
  }

  /**
   * Returns a safe string copy with the basic GraphQL abstract.
   * @returns {string}
   */
  get abstractStructure() {
    return `{
gqlAbstractTableName (
    gqlAbstractFilters
) {
    gqlAbastractColumns
},
gqlAbstractTableAggregateName (
    gqlAbstractAggregateFilters
) {
    aggregate {
      count
    }
  }
}`;
  }

  /**
   * Returns the name of the table
   * @returns {string}
   */
  get table() {
    return this.config["table"];
  }

  /**
   * Sets the name of the table for the abstract
   * @returns {string}
   */
  set table(val) {
    this.config["table"] = val;
  }

  /**
   * Sets the limit of the current query
   * @param {integer} limit - the numer you want to use for a limit
   */
  set limit(limit) {
    this.config["limit"] = limit;
  }

  /**
   * Returns the current limit of the current configuration
   * @returns {integer}
   */
  get limit() {
    return this.config["limit"];
  }

  /**
   * Sets the offset of the current configuration
   * @param {integer} offset - the number you want to use as offset
   */
  set offset(offset) {
    this.config["offset"] = offset;
  }

  /**
   * Returns the offset of the current configuration
   * @returns {integer}
   */
  get offset() {
    return this.config["offset"];
  }

  /**
   * Returns an array of searchable columns
   * @returns {Array}
   */
  get searchableFields() {
    let columns = [];
    for (let [key, value] of this.getEntries("columns")) {
      if (value["searchable"]) columns.push(key);
    }
    return columns;
  }

  /**
   * Resets the value of where to empty
   */
  cleanWhere() {
    this.config["where"] = null;
  }

  /**
   * Replaces or creates a 'where' condition in graphql syntax.
   * @param {string} key - The name of the column
   * @param {string} syntax - the graphql syntax for the where condition
   */
  setWhere(key, syntax) {
    this.config["where"] = {
      [key]: syntax,
    };
  }

  /**
   * Replaces or creates an 'order_by' condition in graphql syntax.
   * @param {string} key - The name of the column
   * @param {string} syntax - either 'asc' or 'desc'
   */
  setOrder(key, syntax) {
    this.config["order_by"][key] = syntax;
  }

  /**
   * Returns true if a column is defined as sortable in the config, assumes false if not found.
   * @param {string} columnName - The name of the column in the config
   * @returns {boolean}
   */
  isSortable(columnName) {
    return this.config["columns"][columnName]["sortable"] || false;
  }

  /**
   * Returns true if a column is defined as searchable in the config, assumes false if not found.
   * @param {string} columnName - The name of the column in the config
   * @returns {boolean}
   */
  isSearchable(columnName) {
    return this.config["columns"][columnName]["searchable"] || false;
  }

  /**
   * Returns true if a column is defined as primary key in the config, assumes false if not found.
   * @param {string} columnName - The name of the column in the config
   * @returns {boolean}
   */
  isPK(columnName) {
    return this.config["columns"][columnName]["primary_key"] || false;
  }

  /**
   * Returns the type of a column as defined in the config, assumes string if not found.
   * @param {string} columnName - The name of the column in the config
   * @returns {boolean}
   */
  getType(columnName) {
    return this.config["columns"][columnName]["type"] || "String";
  }

  /**
   * Returns the label for a column as specified in the config, either a 'table' label or 'search' label.
   * Returns null if the label is not found. Assumes type as 'table'.
   * @param {string} columnName - The name of the column.
   * @param {string} type - Type type: 'table' or 'search'
   * @returns {string|null}
   */
  getLabel(columnName, type = "table") {
    return this.config["columns"][columnName]["label_" + type] || null;
  }

  /**
   * Returns an array with key-value pairs
   * @param {string} section - the 'key' name of the section in the config object
   * @returns {[string, any][]}
   */
  getEntries(section) {
    return Object.entries(this.config[section]);
  }

  /**
   * Returns an array of strings containing the names of the columns in the current state of config
   * @returns {Array}
   */
  get columns() {
    let columns = [];
    for (let [key, value] of this.getEntries("columns")) {
      columns.push(key);
    }
    return columns;
  }

  /**
   * Returns the url path for a single item, or null if ot does not exist.
   * @returns {string|null}
   */
  get singleItem() {
    return this.config["single_item"] || null;
  }

  /**
   * Generates the filters section and injects the abstract with finished GraphQL syntax.
   * @params {bool} aggregate - True if this is an aggregate filter
   * @returns {string}
   */
  generateFilters(aggregate = false) {
    let output = [];

    // Aggregates do not need limit and offset filters
    if (aggregate === false) {
      if (this.config["limit"]) {
        output.push("limit: " + this.config["limit"]);
      }

      if (this.config["offset"] !== null) {
        output.push("offset: " + this.config["offset"]);
      }
    }

    if (this.config["where"] !== null) {
      let where = [];
      for (let [key, value] of this.getEntries("where")) {
        where.push(`${key}: {${value}}`);
      }
      output.push(`where: {${where.join(", ")}}`);
    }

    if (this.config["order_by"] !== null) {
      let order_by = [];
      for (let [key, value] of this.getEntries("order_by")) {
        order_by.push(`${key}: ${value}`);
      }
      output.push(`order_by: {${order_by.join(", ")}}`);
    }

    return output.join(",\n");
  }

  /**
   * Generates a list with the names of the columns in graphql syntax
   * @returns {string}
   */
  generateColumns() {
    let output = [];
    for (let [key, value] of Object.entries(this.config["columns"])) {
      output.push(key);
    }
    return output.join("\n");
  }

  /**
   * Generates a GraphQL query based on the current state of the configuration.
   * @returns {string}
   */
  get query() {
    // First copy the abstract and work from the copy
    let query = this.abstractStructure;

    // Replace the name of the table
    query = query.replace("gqlAbstractTableName", this.config["table"]);
    query = query.replace(
      "gqlAbstractTableAggregateName",
      this.config["table"] + "_aggregate"
    );

    // Generate Filters
    query = query.replace("gqlAbstractFilters", this.generateFilters());
    query = query.replace(
      "gqlAbstractAggregateFilters",
      this.generateFilters(true)
    );

    // Generate Columns
    query = query.replace("gqlAbastractColumns", this.generateColumns());

    // Aggregate Tables

    return query;
  }

  /**
   * Returns a GQL object based on the current state of the configuration.
   * @returns {Object} gql object
   */
  get gql() {
    return gql`
      ${this.query}
    `;
  }
}

export default gqlAbstract;