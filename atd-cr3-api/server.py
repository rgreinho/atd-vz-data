#
# ATD - CR3 Download API
#

import json
import re
import datetime
import boto3
import os

from dotenv import load_dotenv, find_dotenv
from os import environ as env
from functools import wraps
from six.moves.urllib.request import urlopen

from flask import Flask, request, redirect, jsonify, _request_ctx_stack
from flask_cors import cross_origin
from jose import jwt

#
# Environment
#
ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE, verbose=True)

# We need the Auth0 domain, Client ID and current api environment.
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "") 
CLIENT_ID = os.getenv("CLIENT_ID", "")
API_ENVIRONMENT = os.getenv("API_ENVIRONMENT", "STAGING")

# AWS Configuration
AWS_DEFALUT_REGION = os.getenv("AWS_DEFALUT_REGION", "us-east-1")
AWS_S3_KEY = os.getenv("AWS_S3_KEY", "")
AWS_S3_SECRET = os.getenv("AWS_S3_SECRET", "")
AWS_S3_CR3_LOCATION = os.getenv("AWS_S3_CR3_LOCATION", "")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "")




CORS_URL="*"
ALGORITHMS = ["RS256"]
APP = Flask(__name__)


# Format error response and append status code.
class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code


@APP.errorhandler(AuthError)
def handle_auth_error(ex):
    response = jsonify(ex.error)
    response.status_code = ex.status_code
    return response


def get_token_auth_header():
    """Obtains the access token from the Authorization Header
    """
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({"code": "authorization_header_missing",
                        "description":
                            "Authorization header is expected"}, 401)

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must start with"
                            " Bearer"}, 401)
    elif len(parts) == 1:
        raise AuthError({"code": "invalid_header",
                        "description": "Token not found"}, 401)
    elif len(parts) > 2:
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must be"
                            " Bearer token"}, 401)

    token = parts[1]
    return token


def requires_scope(required_scope):
    """Determines if the required scope is present in the access token
    Args:
        required_scope (str): The scope required to access the resource
    """
    token = get_token_auth_header()
    unverified_claims = jwt.get_unverified_claims(token)
    if unverified_claims.get("scope"):
        token_scopes = unverified_claims["scope"].split()
        for token_scope in token_scopes:
            if token_scope == required_scope:
                return True
    return False


def requires_auth(f):
    """Determines if the access token is valid
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_auth_header()
        jsonurl = urlopen("https://"+AUTH0_DOMAIN+"/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())
        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.JWTError:
            raise AuthError({"code": "invalid_header",
                            "description":
                                "Invalid header. "
                                "Use an RS256 signed JWT Access Token"}, 401)
        if unverified_header["alg"] == "HS256":
            raise AuthError({"code": "invalid_header",
                            "description":
                                "Invalid header. "
                                "Use an RS256 signed JWT Access Token"}, 401)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if rsa_key:
            dataConfig = {
                "verify_signature": True, 
                "verify_aud": True,
                "verify_iat": True, 
                "verify_exp": True,
                "verify_nbf": False,
                "verify_iss": True,
                "verify_sub": True,
                "verify_jti": False,
                "verify_at_hash": False,
                "leeway": 0,
            }
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=ALGORITHMS,
                    issuer="https://" + AUTH0_DOMAIN + "/",
                    audience=CLIENT_ID,
                    options=dataConfig
                )
            except jwt.ExpiredSignatureError:
                raise AuthError({"code": "token_expired",
                                "description": "token is expired"}, 401)
            except jwt.JWTClaimsError:
                raise AuthError({"code": "invalid_claims",
                                "description":
                                    "incorrect claims,"
                                    " please check the audience and issuer"}, 401)
            except Exception:
                raise AuthError({"code": "invalid_header",
                                "description":
                                    "Unable to parse authentication"
                                    " token."}, 401)

            _request_ctx_stack.top.current_user = payload
            return f(*args, **kwargs)
        raise AuthError({"code": "invalid_header",
                        "description": "Unable to find appropriate key"}, 401)
    return decorated


# Controllers API
@APP.route("/")
@cross_origin(headers=["Content-Type", "Authorization"])
def healthcheck():
    """No access token required to access this route
    """
    now = datetime.datetime.now()
    response = "CR3 Download API - Health Check - Available @ %s" % now.strftime("%Y-%m-%d %H:%M:%S")
    return jsonify(message=response)


@APP.route("/cr3/download/<crash_id>")
@cross_origin(headers=["Content-Type", "Authorization"])
@cross_origin(headers=["Access-Control-Allow-Origin", CORS_URL])
@requires_auth
def download_crash_id(crash_id):
    """A valid access token is required to access this route
    """
    # We only care for an integer string, anything else is not safe:
    safe_crash_id = re.sub("[^0-9]", "", crash_id)

    s3 = boto3.client("s3",region_name=AWS_DEFALUT_REGION, aws_access_key_id=AWS_S3_KEY, aws_secret_access_key=AWS_S3_SECRET)

    url = s3.generate_presigned_url(
        ExpiresIn=60, # seconds
        ClientMethod='get_object',
        Params={
            'Bucket': AWS_S3_BUCKET,
            'Key': AWS_S3_CR3_LOCATION + "/" + safe_crash_id + ".pdf"
        }
    )

    # For testing uncomment:
    # response = "Private Download, CrashID: %s , %s" % (safe_crash_id, url)
    # return redirect(url, code=302)
    return jsonify(message=url)
    



if __name__ == "__main__":
    APP.run(host="0.0.0.0", port=env.get("PORT", 3010))
