import json
from functools import wraps
from flask import current_app
from models.chore import Chore

def handle_rotation_order(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        chore = args[0]  # First argument is the chore object
        
        # Handle rotation_order based on model type
        if current_app.config['TESTING']:
            if isinstance(chore, TestChore):
                original_rotation_order = chore.get_rotation_order()
                result = f(*args, **kwargs)
                chore.set_rotation_order(chore.rotation_order)
                return result
        return f(*args, **kwargs)
    return wrapper 