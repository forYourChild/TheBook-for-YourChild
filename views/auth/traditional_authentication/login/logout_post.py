from flask import session, jsonify
from views.auth import auth_bp

# 로그아웃 처리
@auth_bp.route('/logout', methods=['POST'])
def logout():
    # 세션에서 user_id 삭제
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200
