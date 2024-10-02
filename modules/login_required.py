from functools import wraps
from flask import session, redirect, url_for

# 로그인 여부를 확인하는 데코레이터
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 세션에 user_id가 없으면 로그인 페이지로 리디렉션
        if 'user_id' not in session:
            return redirect(url_for('onboarding.flask_login'))
        return f(*args, **kwargs)
    return decorated_function
