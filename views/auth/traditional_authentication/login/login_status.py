from flask import session, jsonify
from views.auth import auth_bp

@auth_bp.route('/check_login_status', methods=['GET'])
def check_login_status():
    # Check if user is logged in by checking session for 'user_id'
    if 'user_id' in session:
        return jsonify({
            'is_logged_in': True,
        })
    else:
        return jsonify({'is_logged_in': False})

