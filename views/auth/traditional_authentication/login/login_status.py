from flask import session, jsonify
from modules.db_connect import db_connect
from views.auth import auth_bp

@auth_bp.route('/check_login_status', methods=['GET'])
def check_login_status():
    # Check if user is logged in by checking session for 'user_id'
    if 'user_id' in session:
        user_id =session['user_id']

        # Connect to the database and check if user exists
        db = db_connect()
        cursor = db.cursor()

        cursor.execute("SELECT name FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        return jsonify({
            'is_logged_in': True,
            'user_name' : user[0]
        })
    else:
        return jsonify({'is_logged_in': False})

