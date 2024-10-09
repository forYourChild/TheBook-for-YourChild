from flask import render_template
from modules.login_required import login_required
from . import createbook_bp

@createbook_bp.route('/createbook')
@login_required
def flask_createbook() :
    return render_template('createbook.html')