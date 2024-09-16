from flask import Blueprint

# 각 블루프린트들을 불러옴
from .main import views_bp
from .auth import auth_bp

# Blueprint들을 등록할 수 있는 함수 제공
def views_blueprints(app):
    app.register_blueprint(views_bp)
    app.register_blueprint(auth_bp)
