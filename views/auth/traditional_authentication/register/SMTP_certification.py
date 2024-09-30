from flask_mail import Message
from flask import current_app, request, render_template, jsonify
from modules.db_connect import db_connect
from views.auth import auth_bp
import random
import time

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
    response={'statusCode': '202', 'statusName': 'success'}
    return response

# 인증 코드 전송 및 저장
@auth_bp.route('/send_verification', methods=['POST'])
def send_verification():
    email = request.form['email']

    db = db_connect()
    cursor = db.cursor()

    sql_query = f"SELECT 'email' from user WHERE 'email' = '{email}';"
    cursor.execute(sql_query)
    result = cursor.fetchone()

    if result: 
        response={
            'resultCode': 409,
            'resultDesc': "Conflict",
            'resultMsg': "The account is already subscribed."
        }
        return jsonify(response), 409
    else :
        code = generate_verification_code()
        
        # Redis 객체 가져오기
        redis_instance = current_app.config['SESSION_REDIS']
        
        # Redis에 저장 (email을 키로, code를 값으로) - 유효 기간 10분
        try:
            redis_instance.setex(f'verification_code:{email}', 600, code)
            # 인증 코드 이메일로 전송
            result = send_verification_email(email, code)
            current_time = int(time.time())
            
            if result['statusCode'] == '202':
                response = {
                    'resultCode': 200,
                    'resultDesc': "Success",
                    'resultMsg': "Your mail has been sent.",
                    'start_time': current_time,  # 인증 코드가 저장된 시간
                    'expires_in': 600  # 만료 시간 (초)
                }
                return jsonify(response), 200
            else: 
                response={
                    'resultCode': 401,
                    'resultDesc': "Unauthorized",
                    'resultMsg': "Failed to send mail."
                }
                return jsonify(response), 401
        except Exception as e:
            # Redis 저장 중 오류 발생 시
            response = {
                'resultCode': 500,
                'resultDesc': "Internal Server Error",
                'resultMsg': f"Failed to store verification code. Error: {e}"
            }
            return jsonify(response), 500

# 인증 코드 입력 페이지
@auth_bp.route('/enter_code', methods=['POST'])
def check_verification_code():
    email = request.form['email']
    user_code = request.form['verification_code']

    # Redis에서 저장된 인증 코드 가져오기
    redis_instance = current_app.config['SESSION_REDIS']
    saved_code = redis_instance.get(f'verification_code:{email}')
    
    if saved_code:
        # Redis에서 가져온 데이터는 bytes이므로, 이를 UTF-8로 디코딩합니다.
        saved_code = saved_code.decode('utf-8')
        
        # 인증 코드가 맞는지 확인
        if saved_code == user_code:
            # 인증 성공
            response = {
                'resultCode': 200,
                'resultDesc': "Success",
                'resultMsg': "Verification successful."
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
        # 인증 코드가 없거나 만료된 경우 (Redis에 없는 경우)
        response = {
            'resultCode': 410,
            'resultDesc': "Gone",
            'resultMsg': "Verification code has expired or does not exist."
        }
        return jsonify(response), 410
