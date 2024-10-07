from flask import session, redirect, url_for, jsonify
from modules.oauth import oauth
from modules.db_connect import db_connect
from views.auth import auth_bp
import uuid

def is_email_registered(email, cursor):
    query = "SELECT id FROM users WHERE email = %s;"
    cursor.execute(query, (email,))
    return cursor.fetchone()  # 이미 등록된 경우 해당 사용자의 ID 반환

def register_user(user_key, google_id, email, name, cursor):
    query = """
        INSERT INTO users (id, gid, email, name) VALUES (%s, %s, %s, %s)
    """
    # Google OAuth로 가입한 경우 비밀번호는 생성하지 않으므로 공백 혹은 구글 OAuth 처리용 값 저장
    cursor.execute(query, (user_key, google_id, email, name))

@auth_bp.route('/callback')
def google_callback():
    # 세션에서 저장된 state 및 nonce 값을 불러옴
    state = session.pop('oauth_state', None)
    nonce = session.pop('oauth_nonce', None)

    if not state:
        return "State is missing!", 400

    if not nonce:
        return "Nonce is missing!", 400

    # OAuth 토큰을 요청하여 state를 자동으로 검증
    token = oauth.google.authorize_access_token()

    # ID 토큰을 파싱하고 nonce 검증
    user_info = oauth.google.parse_id_token(token, nonce=nonce)
    user_info_full = oauth.google.userinfo() 

    google_id = user_info_full.get('sub')  # Google 사용자 고유 ID
    email = user_info_full.get('email')  # Google 이메일
    name = user_info_full.get('name', "Unknown")  # Google 이름 (이름이 없는 경우 기본값 설정)

    # 데이터베이스 연결
    db = db_connect()
    cursor = db.cursor()

    try:
        # 사용자가 이미 등록되어 있는지 확인 (id를 반환)
        existing_user = is_email_registered(email, cursor)

        if existing_user:
            # 계정이 이미 등록되어 있는 경우, 해당 ID를 세션에 저장
            user_id = existing_user[0]  # `SELECT id`이므로 첫 번째 값을 사용
            session['user_id'] = user_id
        else:
            # 등록되지 않았다면 구글 이메일을 사용하여 회원가입 처리
            user_key = str(uuid.uuid4())  # 새로운 사용자의 고유 ID 생성
            register_user(user_key, google_id, email, name, cursor)
            db.commit()  # 데이터베이스에 변경사항 반영

            # 새로운 사용자 ID를 세션에 저장 (로그인 처리)
            session['user_id'] = user_key

    except Exception as e:
        db.rollback()  # 오류 발생 시 변경사항 취소
        return jsonify({
            'resultCode': 500,
            'resultDesc': "Internal Server Error",
            'resultMsg': f"An error occurred during registration. {e}"
        }), 500

    finally:
        cursor.close()
        db.close()

    # 회원가입 또는 로그인 성공 후 대시보드로 리다이렉트
    return redirect(url_for('onboarding.flask_main'))
