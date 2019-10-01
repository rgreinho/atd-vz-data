import React, { Component } from "react";
import MapGL, { NavigationControl, FullscreenControl } from "react-map-gl";
import axios from "axios";
import moment from "moment";

import styled from "styled-components";
import { Button } from "reactstrap";

const TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const fullscreenControlStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  padding: "10px",
};

const navStyle = {
  position: "absolute",
  top: 36,
  left: 0,
  padding: "10px",
};

const rasterStyle = {
  version: 8,
  sources: {
    "raster-tiles": {
      type: "raster",
      tiles: [`https://api.nearmap.com/tiles/v3/Vert/{z}/{x}/{y}.jpg?apikey=`],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "simple-tiles",
      type: "raster",
      source: "raster-tiles",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const TimestampDisplay = styled.div`
  top: 24px;
  right: 24px;
  position: absolute;
  #timestamp-display:hover {
    cursor: grab;
  }
`;

export default class LocationMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: this.props.data.atd_txdot_locations[0].latitude,
        longitude: this.props.data.atd_txdot_locations[0].longitude,
        zoom: 17,
        bearing: 0,
        pitch: 0,
      },
      popupInfo: null,
      aerialTimestamp: "",
    };
  }

  _updateViewport = viewport => {
    this.setState({ viewport });
  };

  getLatestAerialTimestamp = timestampArray => timestampArray.slice(-1)[0];

  convertNearMapTimeFormat = date => moment(date).format("MM/DD/YYYY");

  componentDidMount() {
    axios
      .get(
        `https://us0.nearmap.com/maps?ll=${this.state.viewport.latitude},${this.state.viewport.longitude}&nmq=INFO&nmf=json&zoom=17&httpauth=false&apikey=`
      )
      .then(res => {
        const aerialTimestamp = this.convertNearMapTimeFormat(
          this.getLatestAerialTimestamp(res.data.layers.Vert)
        );
        this.setState({ aerialTimestamp });
      });
  }

  render() {
    const { viewport } = this.state;

    return (
      <MapGL
        {...viewport}
        width="100%"
        height="500px"
        mapStyle={rasterStyle}
        onViewportChange={this._updateViewport}
        mapboxApiAccessToken={TOKEN}
      >
        <div className="fullscreen" style={fullscreenControlStyle}>
          <FullscreenControl />
        </div>
        <div className="nav" style={navStyle}>
          <NavigationControl showCompass={false} />
        </div>
        <TimestampDisplay>
          <Button
            id="timestamp-display"
            block
            active
            color="ghost-light"
            aria-pressed="true"
          >
            Imagery captured on {this.state.aerialTimestamp}
          </Button>
        </TimestampDisplay>
      </MapGL>
    );
  }
}
