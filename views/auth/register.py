import uuid
from flask import session, redirect, url_for
from modules.oauth import oauth
from . import auth_bp

@auth_bp.route('/google-login')
def google_login():
    # state 값 생성
    state = str(uuid.uuid4())
    session['oauth_state'] = state  # state 값을 세션에 저장

    # nonce 값 생성 및 세션에 저장
    nonce = str(uuid.uuid4())
    session['oauth_nonce'] = nonce

    redirect_uri = url_for('auth.google_callback', _external=True)
    
    # authorize_redirect에 nonce와 state 값을 전달
    return oauth.google.authorize_redirect(redirect_uri, state=state, nonce=nonce)


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

    user_id = user_info.get('sub')  # Google 사용자 고유 ID
    session['user_id'] = user_id

    # 사용자 정보를 처리한 후 대시보드로 리다이렉트
    return redirect(url_for('auth.dashboard'))
