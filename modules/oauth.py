from authlib.integrations.flask_client import OAuth
import os

# OAuth 객체를 전역적으로 정의
oauth = OAuth()

def define_oauth(app) :    
    oauth.init_app(app)

    oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        access_token_url='https://accounts.google.com/o/oauth2/token',
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',  # userinfo endpoint 추가
        jwks_uri='https://www.googleapis.com/oauth2/v3/certs',  # JWKS URI 추가
        client_kwargs={'scope': 'openid profile email'}
    )

