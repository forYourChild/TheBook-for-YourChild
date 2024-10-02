from flask import request, session, jsonify
from modules.db_connect import db_connect
from views.auth import auth_bp
import bcrypt
import hashlib

def hash_email(email):
    return hashlib.sha256(email.encode('utf-8')).hexdigest()

@auth_bp.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    # Connect to the database and check if user exists
    db = db_connect()
    cursor = db.cursor()

    cursor.execute("SELECT id, password FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    print('user',user)

    if user:
        user_id, stored_password = user
        print(stored_password)
        if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            # Store user ID or email in the session to keep them logged in
            session['user_id'] = user_id
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
            'resultCode': 404,
            'resultDesc': 'Not Found',
            'resultMsg': 'User not found'
        }), 404
