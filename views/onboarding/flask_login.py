from flask import render_template
from . import onboarding_bp

@onboarding_bp.route('/login')
def flask_login() :
    return render_template('login.html')