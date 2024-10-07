from flask import request, jsonify, current_app, session
from modules.db_connect import db_connect
from . import setting_bp
import bcrypt

def is_email_registered(email, cursor):
    query = "SELECT email FROM users WHERE email = %s;"
    cursor.execute(query, (email,))
    return cursor.fetchone() is not None

# Function to hash the password
def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

@setting_bp.route('/resetpassword', methods=['POST'])
def reset_password() :
    data = request.form

    if 'email_verified' not in session :
        return jsonify({
            'resultCode': 401,
            'resultDesc': "Unauthorized.",
            'resultMsg': "Email is not verified"
        }), 400

    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')

    # Ensure required fields are present
    if not all([email, password, confirm_password]):
        return jsonify({
            'resultCode': 400,
            'resultDesc': "Bad Request",
            'resultMsg': "Required fields are missing."
        }), 400

    # Check if passwords match
    if password != confirm_password:
        return jsonify({
            'resultCode': 400,
            'resultDesc': "Bad Request",
            'resultMsg': "Passwords do not match."
        }), 400

    # Ensure password meets complexity requirements (length, special characters)
    if len(password) < 10 or not any(char in "!@#$%^&*(),.?\":{}|<>" for char in password):
        return jsonify({
            'resultCode': 400,
            'resultDesc': "Bad Request",
            'resultMsg': "Password must be at least 10 characters and include a special character."
        }), 400
    
    # Connect to the database
    db = db_connect()
    cursor = db.cursor()

    try : 
        # Check if the email is already registered
        if not is_email_registered(email, cursor):
            return jsonify({
                'resultCode': 409,
                'resultDesc': "Conflict",
                'resultMsg': "This email isn't registered."
            }), 409
        
        hashed_password = hash_password(password)

        query = """
            UPDATE users SET password=%s where email=%s
        """

        cursor.execute(query, (hashed_password, email))
        db.commit()
        session.pop('email_verified', None)

        return jsonify({
            'resultCode': 200,
            'resultDesc': "Success",
            'resultMsg': "Signup successful."
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error during signup: {e}")
        return jsonify({
            'resultCode': 500,
            'resultDesc': "Internal Server Error",
            'resultMsg': "An error occurred on the server."
        }), 500
    
    finally:
        cursor.close()
        db.close()