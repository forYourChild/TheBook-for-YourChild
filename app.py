from flask import Flask
from flask_session import Session
from redis import Redis
from views import onboarding_blueprints
from modules.oauth import define_oauth
from datetime import timedelta
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect
import os

current_path = os.path.dirname(os.path.realpath(__file__))
os.chdir(current_path)

app = Flask(__name__)

# Flask 앱에 필요한 설정 추가
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')

# CSRF 보호 활성화
csrf = CSRFProtect(app)

# Redis 설정 (세션 저장소)
try:
    app.config['SESSION_REDIS'] = Redis(host='localhost', port=6379)
except Exception as e:
    print(f"Redis 연결 오류: {e}")

# Flask-Mail 설정
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv('SERVICE_EMAIL')
app.config['MAIL_PASSWORD'] = os.getenv('SERVICE_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('SERVICE_EMAIL')
mail = Mail(app)

app.config['SESSION_TYPE'] = 'redis'  # 세션을 Redis에 저장
app.config['SESSION_PERMANENT'] = True  # 세션 영구 저장 활성화
app.config['SESSION_USE_SIGNER'] = True  # 세션 쿠키의 무결성 보장
app.config['SESSION_KEY_PREFIX'] = 'sess:'  # Redis 키 앞에 접두어 추가
app.config['SESSION_COOKIE_NAME'] = 'session'  # 쿠키 이름 설정
app.config['SESSION_COOKIE_HTTPONLY'] = True  # JavaScript로 쿠키 접근 금지

# HTTPS 및 개발 환경 분기
if os.getenv('FLASK_ENV') == 'development':
    app.config['SESSION_COOKIE_SECURE'] = False  # 개발 환경에서 HTTPS 비활성화
else:
    app.config['SESSION_COOKIE_SECURE'] = True  # 프로덕션 환경에서는 HTTPS 사용

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Cross-site 요청 방지
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=15)  # 세션 만료 시간을 15일로 설정

# 세션 초기화
Session(app)

# OAuth 설정 및 초기화
define_oauth(app)

# Blueprint 등록
onboarding_blueprints(app)

if __name__ == '__main__':
    app.run(debug=True)
