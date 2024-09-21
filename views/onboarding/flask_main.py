from flask import render_template
from . import onboarding_bp

@onboarding_bp.route('/')
def flask_main() :
    return render_template('index.html')