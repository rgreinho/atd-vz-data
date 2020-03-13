import React, { useState, useEffect } from "react";
import axios from "axios";
import { Redirect } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Col,
  Form,
  FormGroup,
  FormText,
  Input,
  Label,
  Row,
  Alert,
  Spinner,
} from "reactstrap";

const UserForm = ({ type, id = null }) => {
  const token = window.localStorage.getItem("id_token");

  const defaultFormData = {
    name: "",
    email: "",
    password: "",
    blocked: false, // Initialize blocked status
    connection: "Username-Password-Authentication", // Set account type
    verify_email: true, // Send email verification
    app_metadata: {
      roles: ["readOnly"], // Default to lowest level access
    },
  };

  const [userFormData, setUserFormData] = useState(defaultFormData);
  const [isFormDataLoaded, setIsFormDataLoaded] = useState(false);
  const [isSubmissionError, setIsSubmissionError] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const roles = [
    { id: "itSupervisor", label: "IT Supervisor" },
    { id: "admin", label: "Admin" },
    { id: "editor", label: "Editor" },
    { id: "readOnly", label: "Read-only" },
  ];

  // Fetch existing user data if editing
  useEffect(() => {
    if (type === "Edit") {
      const endpoint = `${process.env.REACT_APP_CR3_API_DOMAIN}/user/get_user/${id}`;
      axios
        .get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(res => {
          setUserFormData(res.data);
          setIsFormDataLoaded(true);
        });
    }
  }, [id, type, token]);

  const handleTextInputChange = event => {
    const updatedFormData = {
      ...userFormData,
      [event.target.id]: event.target.value,
    };
    setUserFormData(updatedFormData);
  };

  const handleRoleRadioInputChange = event => {
    const field = "app_metadata";
    const appMetadata = {
      roles: [event.target.value],
    };
    const updatedFormData = { ...userFormData, [field]: appMetadata };

    setUserFormData(updatedFormData);
  };

  // Remove fields not needed for edits (so req does not fail)
  const cleanFormDataForEdit = userFormData => {
    const editFields = ["name", "email", "app_metadata"];

    // If resetting password, must include password and required connection field
    userFormData.password !== "" &&
      editFields.push("password") &&
      editFields.push("connection");

    const cleanedFormData = editFields.reduce((acc, field) => {
      return { ...acc, [field]: userFormData[field] };
    }, {});

    return cleanedFormData;
  };

  const handleFormSubmit = () => {
    if (type === "Edit") {
      const endpoint = `${process.env.REACT_APP_CR3_API_DOMAIN}/user/update_user/${id}`;
      const updatedFormData = cleanFormDataForEdit(userFormData);
      axios
        .put(endpoint, updatedFormData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setIsFormSubmitted(true);
        })
        .catch(() => {
          setIsSubmissionError(true);
        });
    } else if (type === "Add") {
      const endpoint = `${process.env.REACT_APP_CR3_API_DOMAIN}/user/create_user`;
      axios
        .post(endpoint, userFormData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setIsFormSubmitted(true);
        })
        .catch(() => {
          setIsSubmissionError(true);
        });
    }
  };

  const resetForm = () => {
    setUserFormData(defaultFormData);
  };

  const renderErrorMessage = () => (
    <Alert className="mt-3" color="danger">
      Failed to {type.toLowerCase()} user - please try again.
    </Alert>
  );

  // Remove error message after render
  useEffect(() => {
    let errorMessageTimer = setTimeout(() => {
      setIsSubmissionError(false);
    }, 5000);
    return () => {
      clearTimeout(errorMessageTimer);
    };
  }, [isSubmissionError, setIsSubmissionError]);

  return isFormSubmitted ? (
    <Redirect to="/users" />
  ) : (
    <div className="animated fadeIn">
      <Row>
        <Col xs="12" md="6">
          <Card>
            <CardHeader>
              <strong>
                {type} User {type === "Edit" && `ID# ${id}`}
              </strong>
            </CardHeader>
            <CardBody>
              {(isFormDataLoaded && type === "Edit") || type === "Add" ? (
                <Form
                  action=""
                  method="post"
                  encType="multipart/form-data"
                  className="form-horizontal"
                >
                  <FormGroup row>
                    <Col md="3">
                      <Label htmlFor="text-input">Name</Label>
                    </Col>
                    <Col xs="12" md="9">
                      <Input
                        type="text"
                        id="name"
                        name="text-input"
                        placeholder="Name"
                        value={userFormData.name}
                        onChange={handleTextInputChange}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col md="3">
                      <Label htmlFor="email-input">Email</Label>
                    </Col>
                    <Col xs="12" md="9">
                      <Input
                        type="email"
                        id="email"
                        name="email-input"
                        placeholder="Enter Email"
                        autoComplete="email"
                        value={userFormData.email}
                        onChange={handleTextInputChange}
                      />
                      <FormText color="muted">
                        Please enter an austintexas.gov address
                      </FormText>
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col md="3">
                      <Label htmlFor="hf-password">Password</Label>
                    </Col>
                    <Col xs="12" md="9">
                      <Input
                        type="password"
                        id="password"
                        name="password"
                        placeholder={
                          type === "Add"
                            ? "Enter Password..."
                            : "Enter a password to reset..."
                        }
                        autoComplete="current-password"
                        onChange={handleTextInputChange}
                      />
                      <FormText className="help-block">
                        {type === "Add"
                          ? "Please enter a password"
                          : "Only enter a password if you need to reset it"}
                      </FormText>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Col md="3">
                      <Label>Role</Label>
                    </Col>
                    <Col md="9">
                      {roles.map(role => (
                        <FormGroup key={role.id} check className="radio">
                          <Input
                            className="form-check-input"
                            type="radio"
                            id={role.id}
                            name="radios"
                            value={role.id}
                            checked={
                              userFormData.app_metadata.roles[0] === role.id
                            }
                            onChange={handleRoleRadioInputChange}
                          />
                          <Label
                            check
                            className="form-check-label"
                            htmlFor={role.id}
                          >
                            {role.label}
                          </Label>
                        </FormGroup>
                      ))}
                    </Col>
                  </FormGroup>
                </Form>
              ) : (
                <Spinner className="mt-2" color="primary" />
              )}
            </CardBody>
            <CardFooter>
              <Button
                type="submit"
                size="sm"
                color="primary"
                onClick={handleFormSubmit}
              >
                <i className="fa fa-dot-circle-o"></i> Submit
              </Button>{" "}
              {type === "Add" && (
                <Button
                  type="reset"
                  size="sm"
                  color="danger"
                  onClick={resetForm}
                >
                  <i className="fa fa-ban"></i> Reset
                </Button>
              )}
              {isSubmissionError && renderErrorMessage()}
            </CardFooter>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserForm;
