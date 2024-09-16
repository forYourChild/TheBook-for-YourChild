from flask import render_template
from . import views_bp

@views_bp.route('/')
def flask_main() :
    return render_template('index.html')