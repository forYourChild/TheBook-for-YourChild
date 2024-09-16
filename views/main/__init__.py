from flask import Blueprint

views_bp = Blueprint('views', __name__, url_prefix='/')

from . import flask_main

