import logging
from flask import request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("logs/app.log"),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

# Log request details and set user info
def log_request_info(logger):
    try:
        verify_jwt_in_request()
        g.user_id = get_jwt_identity()
        if request.method == "POST":
            logger.info(f"Request: {request.method} {request.url} - Data: {request.get_json()} - User: {g.user_id}")
        else:
            logger.info(f"Request: {request.method} {request.url} - Params: {request.args} - User: {g.user_id}")
    except Exception as e:
        if request.method == "POST":
            logger.info(f"Request: {request.method} {request.url} - Data: {request.get_json()} - No JWT present")
        else:
            logger.info(f"Request: {request.method} {request.url} - Params: {request.args} - No JWT present")

# Log response details
def log_response_info(response, logger):
    logger.info(f"Response: {response.status_code} for {request.method} {request.url}")
    return response 