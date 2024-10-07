from flask import Blueprint

# 각 블루프린트들을 불러옴
from .onboarding import onboarding_bp
from .auth import auth_bp
from .setting import setting_bp
# Blueprint들을 등록할 수 있는 함수 제공
def onboarding_blueprints(app):
    app.register_blueprint(onboarding_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(setting_bp)
    