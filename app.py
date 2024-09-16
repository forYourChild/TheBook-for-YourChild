from flask import Flask
from flask_session import Session
from redis import Redis
from views import views_blueprints
from modules.oauth import define_oauth
from datetime import timedelta
import os

app = Flask(__name__)

# Flask 앱에 필요한 설정 추가
app.secret_key = os.getenv('FLASK_SECRET_KEY')

# Redis 설정 (세션 저장소)
app.config['SESSION_TYPE'] = 'redis'  # 세션을 Redis에 저장
app.config['SESSION_REDIS'] = Redis(host='localhost', port=6379)  # Redis 서버 정보
app.config['SESSION_PERMANENT'] = False  # 세션 영구 저장 비활성화
app.config['SESSION_USE_SIGNER'] = True  # 세션 쿠키의 무결성 보장
app.config['SESSION_KEY_PREFIX'] = 'sess:'  # Redis 키 앞에 접두어 추가
app.config['SESSION_COOKIE_NAME'] = 'session'  # 쿠키 이름 설정
app.config['SESSION_COOKIE_HTTPONLY'] = True  # JavaScript로 쿠키 접근 금지
app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS에서만 쿠키 전송 (HTTPS 환경에서)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Cross-site 요청 방지 
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=4) # 세션 만료 시간을 4시간으로 설정

# 세션 초기화
Session(app)

# OAuth 설정 및 초기화
define_oauth(app)

# Blueprint 등록
views_blueprints(app)

if __name__ == '__main__':
    app.run(debug=True)
