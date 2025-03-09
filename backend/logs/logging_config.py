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
        # Log headers
        logger.info(f"Request Headers: {dict(request.headers)}")
        
        if request.method == "POST":
            # Try to get JSON data
            try:
                json_data = request.get_json(silent=True)
                logger.info(f"Request: {request.method} {request.url} - JSON Data: {json_data} - User: {g.user_id}")
            except Exception as e:
                logger.error(f"Error parsing JSON: {str(e)}")
                # Log raw data if JSON parsing fails
                logger.info(f"Request: {request.method} {request.url} - Raw Data: {request.get_data()} - User: {g.user_id}")
        else:
            logger.info(f"Request: {request.method} {request.url} - Params: {request.args} - User: {g.user_id}")
    except Exception as e:
        # Log headers even when JWT is not present
        logger.info(f"Request Headers: {dict(request.headers)}")
        
        if request.method == "POST":
            try:
                json_data = request.get_json(silent=True)
                logger.info(f"Request: {request.method} {request.url} - JSON Data: {json_data} - No JWT present")
            except Exception as json_e:
                logger.error(f"Error parsing JSON: {str(json_e)}")
                logger.info(f"Request: {request.method} {request.url} - Raw Data: {request.get_data()} - No JWT present")
        else:
            logger.info(f"Request: {request.method} {request.url} - Params: {request.args} - No JWT present")


# Log response details
def log_response_info(response, logger):
    logger.info(f"Response: {response.status_code} - {response.status} for {request.method} {request.url}")
    if response.status_code >= 400:  # Log response data for errors
        try:
            logger.info(f"Response Data: {response.get_data(as_text=True)}")
        except Exception as e:
            logger.error(f"Error logging response data: {str(e)}")
    return response
