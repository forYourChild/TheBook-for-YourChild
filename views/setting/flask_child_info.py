from flask import render_template
from modules.login_required import login_required
from . import setting_bp

@setting_bp.route('/stchildinfo')
@login_required
def flask_child_info() :
    return render_template('setting_child_info.html')