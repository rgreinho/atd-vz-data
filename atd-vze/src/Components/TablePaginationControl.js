import React, { useState, useEffect } from "react";
import { ButtonToolbar, Button, ButtonGroup } from "reactstrap";

import { useQuery } from "@apollo/react-hooks";
import { withApollo } from "react-apollo";
import { gql } from "apollo-boost";
import styled from "styled-components";

const StyledIcon = styled.i`
  pointer-events: none;
`;

const TablePaginationControl = props => {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(100);

  const pageQuery = () => {
    let queryWithPage = props.queryString.replace("LIMIT", `limit: ${limit}`);
    queryWithPage = queryWithPage.replace("OFFSET", `offset: ${offset}`);
    return gql`
      ${queryWithPage}
    `;
  };

  const { loading: pageLoading, error: pageError, data: pageData } = useQuery(
    pageQuery()
  );

  useEffect(() => {
    props.updateResults(pageData);
  }, [pageData]);

  const updatePage = e => {
    const pageOption = e.target.innerText;
    if (offset !== 0 && pageOption.match("Prev")) {
      const decreasedOffset = offset - limit;
      setOffset(decreasedOffset);
    }
    if (offset === 0 && pageOption.match("Prev")) {
      return null;
    }
    if (pageOption.match("Next")) {
      const increasedOffset = offset + limit;
      setOffset(increasedOffset);
    }
  };

  return (
    <>
      <ButtonToolbar className="justify-content-between">
        <ButtonGroup>
          <Button onClick={updatePage}>
            <StyledIcon>
              <i className="fa fa-arrow-circle-left" />
            </StyledIcon>{" "}
            Prev
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button onClick={updatePage}>
            Next{" "}
            <StyledIcon>
              <i className="fa fa-arrow-circle-right" />
            </StyledIcon>
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
      <br />
    </>
  );
};

export default withApollo(TablePaginationControl);