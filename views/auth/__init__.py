from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

from views.auth.google_login import google_login, google_callback
from views.auth.traditional_authentication.register import SMTP_certification
