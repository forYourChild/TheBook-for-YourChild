import boto3
import cv2
import os
from PIL import Image
from io import BytesIO
from flask import current_app
from dotenv import load_dotenv

def __s3_setting(S3_BUCKET) :
    load_dotenv()

    S3_BUCKET = S3_BUCKET
    S3_REGION = os.getenv('S3_REGION')
    S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY')
    S3_SECRET_KEY = os.getenv('S3_SECRET_KEY')
    
    # Initialize AWS S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION
    )

    return s3_client, S3_BUCKET, S3_REGION

# AWS S3에 이미지 업로드 함수
def upload_to_s3(image, filename, S3_BUCKET):
    s3_client, S3_BUCKET, S3_REGION = __s3_setting(S3_BUCKET)
    try:
        # 이미지 메모리 버퍼에 저장
        img_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))  # OpenCV BGR을 PIL RGB로 변환
        buffer = BytesIO()
        img_pil.save(buffer, format='JPEG')
        buffer.seek(0)

        # S3에 업로드
        s3_client.upload_fileobj(
            buffer,
            S3_BUCKET,
            filename,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )

        # 업로드된 파일의 S3 URL 반환
        return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{filename}"
    
    except Exception as e:
        current_app.logger.error(f"Failed to upload image to S3: {e}")
        return None
