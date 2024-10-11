from flask import Blueprint

createbook_bp = Blueprint('createbook', __name__, url_prefix='/createbook')

from . import flask_createbook, createbook_send_que