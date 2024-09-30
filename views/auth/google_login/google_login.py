import uuid
from flask import session, url_for
from modules.oauth import oauth
from views.auth import auth_bp

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
