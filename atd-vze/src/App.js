import React, { Component } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
// import { renderRoutes } from 'react-router-config';

// Authentication
import Auth from "./auth/Auth";
import Callback from "./auth/Callback";

// Apollo GraphQL Client
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "@apollo/react-hooks";

// Style
import "./App.scss";

// Apollo client settings.
const client = new ApolloClient({
  uri: "https://vzd.austintexas.io/v1/graphql",
  headers: {
    "x-hasura-admin-secret": "HASURA KEY GOES HERE"
  }
});

const loading = () => (
  <div className="animated fadeIn pt-3 text-center">Loading...</div>
);

// Containers
const DefaultLayout = React.lazy(() => import("./containers/DefaultLayout"));

// Pages
const Login = React.lazy(() => import("./views/Pages/Login"));
const Register = React.lazy(() => import("./views/Pages/Register"));
const Page404 = React.lazy(() => import("./views/Pages/Page404"));
const Page500 = React.lazy(() => import("./views/Pages/Page500"));

class App extends Component {
  constructor(props) {
    super(props);
    this.auth = new Auth(this.props.history);
  }
  
  render() {
    return (
      <ApolloProvider client={client}>
        <HashRouter>
          <React.Suspense fallback={loading()}>
            <Switch>
              <Route
                exact
                path="/login"
                name="Login Page"
                render={props => <Login {...props} />}
              />
              <Route
                exact
                path="/register"
                name="Register Page"
                render={props => <Register {...props} />}
              />
              <Route
                exact
                path="/404"
                name="Page 404"
                render={props => <Page404 {...props} />}
              />
              <Route
                exact
                path="/500"
                name="Page 500"
                render={props => <Page500 {...props} />}
              />
              <Route
                path="/"
                name="Home"
                render={props => <DefaultLayout {...props} />}
              />
            </Switch>
          </React.Suspense>
        </HashRouter>
      </ApolloProvider>
    );
  }
}

export default App;
