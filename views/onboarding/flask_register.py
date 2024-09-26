from flask import render_template
from . import onboarding_bp

@onboarding_bp.route('/register')
def flask_register() :
    return render_template('register.html')