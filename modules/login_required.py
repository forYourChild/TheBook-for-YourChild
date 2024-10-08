from functools import wraps
from flask import session, request, redirect, url_for

# 로그인 여부를 확인하는 데코레이터
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # 경로와 쿼리스트링만 next 파라미터로 전달 (도메인 제외)
            next_url = request.full_path if request.query_string else request.path
            return redirect(url_for('onboarding.flask_login', next=next_url))
        return f(*args, **kwargs)
    return decorated_function
