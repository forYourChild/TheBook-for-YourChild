import pika
from flask import request, jsonify, session, current_app
from modules.db_connect import db_connect
from modules.rabbitmq_connect import rabbitmq_connect
from . import createbook_bp

# POST 요청을 처리하고 큐에 메시지를 보내는 라우트
@createbook_bp.route('/generate-storybook', methods=['POST'])
def generate_storybook():
    try:
        # 요청으로부터 데이터 가져오기
        data = request.json
        child_name = data.get('child')
        teaching_content = data.get('teachingContent')

        # 세션에서 user_id 가져오기
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({
                'resultCode': 401,
                'resultDesc': 'Unauthorized',
                'resultMsg': 'User is not logged in.'
            }), 401

        # DB 연결
        db = db_connect()
        cursor = db.cursor()

        # 자녀 정보 조회 (name과 parent가 user_id인 자녀 검색)
        query = """
            SELECT name, gender, likes, characteristics 
            FROM child 
            WHERE parent = %s AND name = %s
        """
        cursor.execute(query, (user_id, child_name))
        child_data = cursor.fetchone()

        if not child_data:
            return jsonify({
                'resultCode': 404,
                'resultDesc': 'Not Found',
                'resultMsg': f"Child with name '{child_name}' not found."
            }), 404

        # RabbitMQ에 연결
        queue_name= 'storybook_queue_story'
        connection, channel = rabbitmq_connect(queue_name)

        # 자녀 정보와 교육 내용을 큐로 보낼 메시지 생성
        message = {
            'user_id': user_id,
            'child': {
                'name': child_data[0],
                'gender': child_data[1],
                'likes': child_data[2].split(','),  # likes는 콤마로 구분된 문자열이므로 리스트로 변환
                'characteristics': child_data[3]
            },
            'teachingContent': teaching_content
        }

        # 메시지를 큐에 보냄
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=str(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # 메시지를 지속적으로 저장
            )
        )

        # RabbitMQ 연결 닫기
        connection.close()

        # 데이터베이스 연결 닫기
        cursor.close()
        db.close()

        return jsonify({
            'resultCode': 200,
            'resultDesc': 'Success',
            'resultMsg': 'Storybook generation request sent to queue successfully.'
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error processing storybook generation: {e}")
        return jsonify({
            'resultCode': 500,
            'resultDesc': 'Internal Server Error',
            'resultMsg': 'Failed to process the storybook generation request.'
        }), 500
