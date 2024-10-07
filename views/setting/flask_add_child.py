from flask import render_template
from modules.login_required import login_required
from . import setting_bp

@setting_bp.route('/stchildadd')
@login_required
def flask_add_child() :
    return render_template('setting_add_child.html')