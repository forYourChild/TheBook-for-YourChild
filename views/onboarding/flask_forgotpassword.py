from flask import render_template
from modules.login_required import login_required
from . import onboarding_bp

@onboarding_bp.route('/forgotpassword')
def flask_frpassword() :
    return render_template('forgot_password.html')