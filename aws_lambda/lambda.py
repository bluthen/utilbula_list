import json
import base64
import boto3
import uuid
import traceback


def valid_uuid(uuid_str):
    try:
        val = uuid.UUID(uuid_str, version=4)
        return True
    except ValueError:
        return False


def lambda_handler(event, context):
    # TODO implement
    print(event, context)

    method = event['requestContext']['http']["method"]
    if method not in ['GET', 'POST']:
        return {'statusCode': 501, 'body': 'Invalid method'}

    body = None
    if method == 'GET':
        hash = event['queryStringParameters']['hash']
    else:
        # body = base64.b64decode(event["body"]).decode()
        body = event['body']
        if len(body) > 100000:
            return {'statusCode': 400, 'body': 'size is too large'}
        body = json.loads(body)
        hash = body['hash']

    if not valid_uuid(hash):
        return {'statusCode': 400, 'body': 'Invalid hash'}

    # return {
    #     'statusCode': 200,
    #     'body': json.dumps(event)
    # }

    s3 = boto3.resource('s3')
    bucket = 'makelist-db.coldstonelabs.net'
    obj_str = '{"id": -1}'
    try:
        obj = s3.Object(bucket, hash)
        obj_str = obj.get()['Body'].read().decode()
    except:
        traceback.print_exc()
        if method == 'GET':
            return {'statusCode': 404, 'body': 'Nothing found'}
    if method == 'GET':
        return {'statusCode': 200, 'body': obj_str}
    obj = json.loads(obj_str)
    if obj['id'] > body['id']:
        return {'statusCode': 400, 'body': 'invalid counter'}

    save = {"id": body["id"], "title": body["title"], "list": body["list"], "text": body["text"]}
    s3.Object(bucket, hash).put(Body=json.dumps(save))
    return {'statusCode': 204, 'body': 'Saved'}
