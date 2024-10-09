import cv2
import numpy as np
import mediapipe as mp
from flask import request, jsonify, current_app, session
from modules.s3_image_upload import upload_to_s3
from modules.db_connect import db_connect
from views.setting import setting_bp
import uuid
import os

# Mediapipe 얼굴 감지 초기화
mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

def detect_and_crop_face(image, margin=0.2):
    """
    얼굴을 검출하고, 얼굴 주위의 머리카락 영역도 포함하여 크롭하는 함수.
    margin 파라미터를 통해 얼굴 주변 영역을 더 크게 크롭할 수 있음.
    """
    with mp_face_detection.FaceDetection(min_detection_confidence=0.5) as face_detection:
        # 이미지를 Mediapipe에서 사용할 RGB 형식으로 변환
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # 얼굴 검출
        results = face_detection.process(img_rgb)
        
        if results.detections:
            # 첫 번째 얼굴을 기준으로 바운딩 박스를 가져옴
            detection = results.detections[0]
            bboxC = detection.location_data.relative_bounding_box
            h, w, _ = image.shape
            
            # 바운딩 박스를 기준으로 좌표 계산 (머리카락 포함하도록 마진 추가)
            x1 = max(0, int((bboxC.xmin - margin) * w))
            y1 = max(0, int((bboxC.ymin - margin) * h))
            x2 = min(w, int((bboxC.xmin + bboxC.width + margin) * w))
            y2 = min(h, int((bboxC.ymin + bboxC.height + margin) * h))
            
            # 얼굴과 머리카락이 포함된 영역을 크롭한 이미지 반환
            cropped_face = image[y1:y2, x1:x2]
            return cropped_face
        
        return None

# 아이 등록 라우트
@setting_bp.route('/addchild', methods=['POST'])
def register_child():
    data = request.form

    # Retrieve input values
    name = data.get('name')
    gender = data.get('gender')
    if gender == 'male' :
        gender = 'M'
    elif gender == 'female' :
        gender = 'F'
    else :
        gender = 'O'
        
    tags = data.get('tags')  # Comma-separated string of tags
    characteristics = data.get('characteristics')
    image_file = request.files.get('image')  # Retrieve the uploaded image file

    # Ensure required fields are present
    if not all([name, gender, characteristics, image_file]):
        return jsonify({
            'resultCode': 400,
            'resultDesc': "Bad Request",
            'resultMsg': "Required fields are missing."
        }), 400

    # Connect to the database
    db = db_connect()
    cursor = db.cursor()

    try:
        # 이미지 처리
        image = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(image, cv2.IMREAD_COLOR)

        # 얼굴 검출 및 크롭
        cropped_face = detect_and_crop_face(img)
        if cropped_face is None:
            return jsonify({
                'resultCode': 400,
                'resultDesc': "Bad Request",
                'resultMsg': "No face detected in the uploaded image. Please upload an image with a clear face."
            }), 400


        S3_BUCKET = os.getenv('S3_BUCKET_CHILD')

        # S3에 얼굴 이미지 업로드
        child_id = str(uuid.uuid4())
        s3_filename = f"child_face/{child_id}.jpg"
        user_id = session['user_id']
        s3_image_url = upload_to_s3(cropped_face, s3_filename, S3_BUCKET)

        if s3_image_url is None:
            return jsonify({
                'resultCode': 500,
                'resultDesc': "Internal Server Error",
                'resultMsg': "Failed to upload image to S3."
            }), 500

        # Insert the child information into the database
        query = """
            INSERT INTO child (id, parent, name, gender, likes, characteristics, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (child_id, user_id, name, gender, tags, characteristics, s3_image_url))
        db.commit()

        return jsonify({
            'resultCode': 200,
            'resultDesc': "Success",
            'resultMsg': "Child registration successful."
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error during child registration: {e}")
        return jsonify({
            'resultCode': 500,
            'resultDesc': "Internal Server Error",
            'resultMsg': "An error occurred on the server."
        }), 500

    finally:
        cursor.close()
        db.close()
