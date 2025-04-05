import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

# Initialize AWS resources
dynamodb = boto3.resource('dynamodb', region_name="ap-south-1")
s3 = boto3.client('s3', region_name="ap-south-1")

# S3 Bucket names
VIDEO_BUCKET = 'riseup-videos'
JOB_PDF_BUCKET = 'riseup-job-pdfs'

# DynamoDB Table Definitions
TABLES = {
    'Users': {
        'KeySchema': [
            {'AttributeName': 'user_id', 'KeyType': 'HASH'},  # Partition key
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'UserSkills': {
        'KeySchema': [
            {'AttributeName': 'user_id', 'KeyType': 'HASH'},
            {'AttributeName': 'skill_id', 'KeyType': 'RANGE'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
            {'AttributeName': 'skill_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'Skills': {
        'KeySchema': [
            {'AttributeName': 'skill_id', 'KeyType': 'HASH'},
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'skill_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'NGOs': {
        'KeySchema': [
            {'AttributeName': 'ngo_id', 'KeyType': 'HASH'},
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'ngo_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'Videos': {
        'KeySchema': [
            {'AttributeName': 'video_id', 'KeyType': 'HASH'},
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'video_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'VideoSkills': {
        'KeySchema': [
            {'AttributeName': 'video_id', 'KeyType': 'HASH'},
            {'AttributeName': 'skill_id', 'KeyType': 'RANGE'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'video_id', 'AttributeType': 'S'},
            {'AttributeName': 'skill_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'Jobs': {
        'KeySchema': [
            {'AttributeName': 'job_id', 'KeyType': 'HASH'},
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'job_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    },
    'UserQuizScores': {
        'KeySchema': [
            {'AttributeName': 'user_id', 'KeyType': 'HASH'},
            {'AttributeName': 'video_id', 'KeyType': 'RANGE'}
        ],
        'AttributeDefinitions': [
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
            {'AttributeName': 'video_id', 'AttributeType': 'S'},
        ],
        'ProvisionedThroughput': {
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    }
}

def create_tables():
    """Create all DynamoDB tables if they don't exist"""
    existing_tables = dynamodb.meta.client.list_tables()['TableNames']
    
    for table_name, table_schema in TABLES.items():
        if table_name not in existing_tables:
            try:
                table = dynamodb.create_table(
                    TableName=table_name,
                    KeySchema=table_schema['KeySchema'],
                    AttributeDefinitions=table_schema['AttributeDefinitions'],
                    ProvisionedThroughput=table_schema['ProvisionedThroughput']
                )
                # Wait for table to be created
                table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
                print(f"Created table {table_name}")
            except ClientError as e:
                print(f"Error creating table {table_name}: {e}")
                raise  # Re-raise the exception to stop the process

def add_email_indexes():
    """Add email indexes to Users and NGOs tables"""
    try:
        # Add email index to Users table
        users_table = dynamodb.Table('Users')
        users_table.meta.client.update_table(
            TableName='Users',
            AttributeDefinitions=[
                {'AttributeName': 'email', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexUpdates=[
                {
                    'Create': {
                        'IndexName': 'EmailIndex',
                        'KeySchema': [
                            {'AttributeName': 'email', 'KeyType': 'HASH'}
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        },
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                }
            ]
        )
        print("Added email index to Users table")

        # Add email index to NGOs table
        ngos_table = dynamodb.Table('NGOs')
        ngos_table.meta.client.update_table(
            TableName='NGOs',
            AttributeDefinitions=[
                {'AttributeName': 'email', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexUpdates=[
                {
                    'Create': {
                        'IndexName': 'EmailIndex',
                        'KeySchema': [
                            {'AttributeName': 'email', 'KeyType': 'HASH'}
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        },
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                }
            ]
        )
        print("Added email index to NGOs table")
    except ClientError as e:
        print(f"Error adding email indexes: {e}")
        raise

def create_s3_buckets():
    """Create S3 buckets if they don't exist"""
    try:
        s3.create_bucket(
            Bucket=VIDEO_BUCKET,
            CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'}
        )
        print(f"Created bucket {VIDEO_BUCKET}")
    except ClientError as e:
        if e.response['Error']['Code'] != 'BucketAlreadyOwnedByYou':
            print(f"Error creating bucket {VIDEO_BUCKET}: {e}")
            raise

    try:
        s3.create_bucket(
            Bucket=JOB_PDF_BUCKET,
            CreateBucketConfiguration={'LocationConstraint': 'ap-south-1'}
        )
        print(f"Created bucket {JOB_PDF_BUCKET}")
    except ClientError as e:
        if e.response['Error']['Code'] != 'BucketAlreadyOwnedByYou':
            print(f"Error creating bucket {JOB_PDF_BUCKET}: {e}")
            raise

if __name__ == '__main__':
    create_tables()
    add_email_indexes()
    create_s3_buckets() 