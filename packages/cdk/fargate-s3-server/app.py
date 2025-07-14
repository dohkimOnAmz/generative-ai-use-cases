from fastapi import FastAPI, HTTPException, Response, status
from fastapi.responses import StreamingResponse
import uvicorn
import logging
import boto3
import os

BUCKET = os.environ['BUCKET_NAME']

s3 = boto3.client('s3')

app = FastAPI()

def stream_from_s3(key: str):
    obj = s3.get_object(Bucket=BUCKET, Key=key)

    for chunk in obj['Body'].iter_chunks():
        yield chunk

@app.get('/healthcheck')
async def healthcheck():
    return Response(status_code=status.HTTP_200_OK)

@app.get('{key:path}')
async def get_file(key: str):
    print(key)

    try:
        if key.startswith('/'):
            key = key[1:]

        head = s3.head_object(Bucket=BUCKET, Key=key)
        return StreamingResponse(
            stream_from_s3(key),
            media_type=head['ContentType'],
            headers={
                'Content-Length': str(head['ContentLength'])
            },
        )
    except:
        return StreamingResponse(
            stream_from_s3('index.html'),
            media_type='text/html',
        )

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    uvicorn.run(app, host='0.0.0.0', port=8080)
