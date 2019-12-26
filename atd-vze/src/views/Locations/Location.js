import React, { useState } from "react";
import moment from "moment";
import DataTable from "../../Components/DataTable";
import LocationMap from "./LocationMap";
import LocationEditMap from "./LocationEditMap";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Button,
  ButtonGroup,
} from "reactstrap";

import { withApollo } from "react-apollo";
import { useQuery } from "@apollo/react-hooks";

import locationDataMap from "./locationDataMap";
import LocationCrashes from "./LocationCrashes";

import { GET_LOCATION, UPDATE_LOCATION } from "../../queries/Locations";

function Location(props) {
  // Date five years ago for crash totals and est. comp. cost totals
  const fiveYearsAgo = moment()
    .subtract(5, "years")
    .format("YYYY=MM-DD");

  const locationId = props.match.params.id;
  const [mapSelected, setMapSelected] = useState("aerial");
  const { loading, error, data, refetch } = useQuery(GET_LOCATION, {
    variables: { id: locationId, fiveYearsAgo: fiveYearsAgo },
  });

  console.log(data);

  const [editField, setEditField] = useState("");
  const [formData, setFormData] = useState({});

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  const handleInputChange = e => {
    const newFormState = Object.assign(formData, {
      [editField]: e.target.value,
    });
    setFormData(newFormState);
  };

  const handleFieldUpdate = e => {
    e.preventDefault();

    props.client
      .mutate({
        mutation: UPDATE_LOCATION,
        variables: {
          locationId: locationId,
          changes: formData,
        },
      })
      .then(res => refetch());

    setEditField("");
  };

  const handleMapChange = e => {
    e.preventDefault();
    setMapSelected(e.target.id);
  };

  return (
    <div className="animated fadeIn">
      <Row>
        <Col>
          <h2 className="h2 mb-3">{data.atd_txdot_locations[0].description}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="6">
          <Card>
            <CardHeader>
              <i className="fa fa-map fa-lg mt-3"></i> View or Edit Location
              <ButtonGroup className="float-right">
                <Button
                  active={mapSelected === "aerial"}
                  id="aerial"
                  onClick={handleMapChange}
                  color="dark"
                  outline
                >
                  Aerial Map
                </Button>
                <Button
                  active={mapSelected === "edit"}
                  id="edit"
                  onClick={handleMapChange}
                  color="dark"
                  outline
                >
                  Edit Polygon
                </Button>
              </ButtonGroup>
            </CardHeader>
            <CardBody>
              {data && mapSelected === "aerial" && <LocationMap data={data} />}
              {data && mapSelected === "edit" && (
                <LocationEditMap data={data} refetch={refetch} />
              )}
            </CardBody>
          </Card>
        </Col>
        <DataTable
          dataMap={locationDataMap}
          dataTable={"atd_txdot_locations"}
          formData={formData}
          setEditField={setEditField}
          editField={editField}
          handleInputChange={handleInputChange}
          handleFieldUpdate={handleFieldUpdate}
          data={data}
        />
      </Row>
      <Row>
        <Col>
          <LocationCrashes locationId={locationId} />
        </Col>
      </Row>
    </div>
  );
}

export default withApollo(Location);
