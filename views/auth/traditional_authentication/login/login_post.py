from flask import request, session, jsonify, redirect, url_for
from modules.db_connect import db_connect
from views.auth import auth_bp
import bcrypt
import hashlib

def hash_email(email):
    return hashlib.sha256(email.encode('utf-8')).hexdigest()

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        email = request.form.get('email')
        password = request.form.get('password')
        next_url = request.args.get('next')  # 로그인 후 돌아갈 URL (next 파라미터 확인)
        print(next_url)

        # Connect to the database and check if user exists
        db = db_connect()
        cursor = db.cursor()

        cursor.execute("SELECT id, password FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            user_id, stored_password = user
            if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
                # Store user ID or email in the session to keep them logged in
                session['user_id'] = user_id

                # next_url이 있으면 해당 URL로 리디렉션, 없으면 기본 페이지로 리디렉션
                if next_url:
                    return redirect(next_url)
                return jsonify({
                    'resultCode': 200,
                    'resultDesc': 'Success',
                    'resultMsg': 'Login successful'
                }), 200
            else:
                return jsonify({
                    'resultCode': 401,
                    'resultDesc': 'Unauthorized',
                    'resultMsg': 'Invalid email or password'
                }), 401
        else:
            return jsonify({
                    'resultCode': 401,
                    'resultDesc': 'Unauthorized',
                    'resultMsg': 'Invalid email or password'
                }), 401
    finally:
        cursor.close()
        db.close()
