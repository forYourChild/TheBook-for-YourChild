from flask import Blueprint

setting_bp = Blueprint('setting', __name__, url_prefix='/setting')

from . import flask_child_info, reset_password, flask_add_child, add_child

