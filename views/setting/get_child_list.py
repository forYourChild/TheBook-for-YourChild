from flask import jsonify, current_app
from modules.db_connect import db_connect
from . import setting_bp

@setting_bp.route('/getchildlist', methods=['GET'])
def get_children():
    # DB 연결
    db = db_connect()
    cursor = db.cursor()

    try:
        query = "SELECT name, gender, likes, characteristics, image_url FROM child"
        cursor.execute(query)
        children = cursor.fetchall()

        # 가져온 데이터를 리스트 형식으로 변환
        children_list = []
        for child in children:
            children_list.append({
                'name': child[0],
                'gender': child[1],
                'likes': child[2].split(','),  # 태그는 콤마로 구분된 문자열로 저장됨
                'characteristics': child[3],
                'image': child[4]  # S3 URL 또는 이미지 경로
            })

        return jsonify({'children': children_list}), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching children: {e}")
        return jsonify({'error': 'Failed to fetch children'}), 500

    finally:
        cursor.close()
        db.close()
