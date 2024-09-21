from flask import Blueprint

onboarding_bp = Blueprint('onboarding', __name__, url_prefix='/')

from . import flask_main, flask_login

