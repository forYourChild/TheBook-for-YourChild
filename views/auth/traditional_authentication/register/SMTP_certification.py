import random
import time
from flask import current_app, request, render_template, jsonify, session
from flask_mail import Message
from modules.db_connect import db_connect
from views.auth import auth_bp
from datetime import timedelta

# 인증 코드 생성 함수
def generate_verification_code():
    otp = str(random.randint(100000, 999999))
    return otp

# 이메일 전송 함수 (HTML 템플릿 사용)
def send_verification_email(to_email, verification_code):
    mail = current_app.extensions.get('mail')  # Flask-Mail 인스턴스를 가져옴
    if not mail:
        raise RuntimeError("Mail extension is not initialized.")
    
    # 이메일 HTML과 텍스트로 구성된 메시지 전송
    msg = Message(
        subject="[TheBookforYourChild]Your Verification Code",
        sender=current_app.config.get('MAIL_DEFAULT_SENDER'),
        recipients=[to_email]
    )
    
    # HTML 템플릿 렌더링
    msg.html = render_template('verification_email.html', verification_code=verification_code)
    
    mail.send(msg)
    response = {'statusCode': 202, 'statusName': 'success'}
    return response

# 인증 코드 전송 및 저장
@auth_bp.route('/send_verification', methods=['POST'])
def send_verification():
    email = request.form['email']
    is_resend = request.form.get('resend', 'false').lower() == 'true'

    # Resend Cooldown Check (30-seconds cooldown)
    cooldown_key = f'resend_cooldown:{email}'
    cooldown_time = session.get(cooldown_key)

    if cooldown_time:
        remaining_time = int(cooldown_time) - int(time.time())
        if remaining_time > 0:
            response = {
                'resultCode': 429,
                'resultDesc': "Too Many Requests",
                'resultMsg': f"Please wait {remaining_time // 60}:{remaining_time % 60:02d} before resending the verification code."
            }
            return jsonify(response), 429

    # If it's a resend request
    if is_resend:
        saved_code = session.get(f'verification_code:{email}')
        if saved_code:
            current_time = int(time.time())
            session[f'verification_code:{email}'] = saved_code  # Reset expiration

            # Set cooldown for 15 seconds
            session[cooldown_key] = current_time + 15

            response = {
                'resultCode': 200,
                'resultDesc': "Success",
                'resultMsg': "Verification code resent successfully.",
                'start_time': current_time,
                'expires_in': expiration_time
            }
            send_verification_email(email, saved_code)
            return jsonify(response), 200
        else:
            is_resend = False  # Treat it like a new request

    # 새 코드 생성 또는 만료 시 새로운 인증 코드 생성
    if not is_resend:
        code = generate_verification_code()

        try:
            current_time = int(time.time())
            expiration_time = current_time + 900  # 15분(900초) 뒤에 만료
            print(expiration_time, current_time)

            # 세션에 인증 코드 및 만료 시간 저장
            session[f'verification_code:{email}'] = code
            session[f'verification_code_expiration:{email}'] = expiration_time
            session[cooldown_key] = current_time + 15  # Set cooldown for resending for 15 seconds

            result = send_verification_email(email, code)

            if result['statusCode'] == 202:
                response = {
                    'resultCode': 200,
                    'resultDesc': "Success",
                    'resultMsg': "Your mail has been sent.",
                    'start_time': current_time,
                    'expires_in': expiration_time
                }
                return jsonify(response), 200
            else:
                response = {
                    'resultCode': 401,
                    'resultDesc': "Unauthorized",
                    'resultMsg': "Failed to send mail."
                }
                return jsonify(response), 401
        except Exception as e:
            response = {
                'resultCode': 500,
                'resultDesc': "Internal Server Error",
                'resultMsg': f"Failed to store verification code. Error: {e}"
            }
            return jsonify(response), 50

# 인증 코드 입력 페이지
@auth_bp.route('/enter_code', methods=['POST'])
def check_verification_code():
    try : 
        email = request.form['email']
        user_code = request.form['verification_code']
        action_type = request.form.get('action_type', 'register')

        db = db_connect()
        cursor = db.cursor()

        # 이메일이 이미 존재하는지 확인
        cursor.execute("SELECT email FROM users WHERE email = %s;", (email,))
        result = cursor.fetchone()

        # 세션에서 저장된 인증 코드 및 만료 시간 가져오기
        saved_code = session.get(f'verification_code:{email}')
        expiration_time = session.get(f'verification_code_expiration:{email}')

        # 인증 코드가 만료되었는지 확인 (현재 시간과 비교)
        if expiration_time and time.time() > expiration_time:
            session.pop(f'verification_code:{email}', None)
            session.pop(f'verification_code_expiration:{email}', None)
            response = {
                'resultCode': 410,
                'resultDesc': "Gone",
                'resultMsg': "Verification code has expired."
            }
            return jsonify(response), 410

        if saved_code:
            # 인증 코드가 맞는지 확인
            if saved_code == user_code:
                if action_type == 'register' :
                    if result:
                        # 이미 가입된 이메일인 경우
                        response = {
                            'resultCode': 409,
                            'resultDesc': "Conflict",
                            'resultMsg': "The account is already subscribed."
                        }
                        return jsonify(response), 409
                elif action_type == 'reset_password' :
                    pass

                # 인증 성공 후 세션에서 관련 정보 제거
                session.pop(f'verification_code:{email}', None)
                session.pop(f'verification_code_expiration:{email}', None)
                session.pop(f'resend_cooldown:{email}', None)

                # 인증 성공 후 이메일 인증 정보를 저장
                session['email_verified'] = email

                response = {
                    'resultCode': 200,
                    'resultDesc': "Success",
                    'resultMsg': "Verification successful. Session data cleared."
                }
                return jsonify(response), 200
            else:
                # 인증 코드 불일치 (잘못된 코드)
                response = {
                    'resultCode': 401,
                    'resultDesc': "Unauthorized",
                    'resultMsg': "Invalid verification code."
                }
                return jsonify(response), 401
        else:
            # 인증 코드가 없거나 만료된 경우 (세션에 없는 경우)
            response = {
                'resultCode': 410,
                'resultDesc': "Gone",
                'resultMsg': "Verification code has expired or does not exist."
            }
            return jsonify(response), 410
    finally :
        cursor.close()
        db.close()
