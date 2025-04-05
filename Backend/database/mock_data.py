import boto3
import json
import uuid
from datetime import datetime
import os
from schema import dynamodb, s3, TABLES, VIDEO_BUCKET, JOB_PDF_BUCKET
from botocore.exceptions import ClientError

def create_tables_and_buckets():
    """Create all tables and buckets if they don't exist"""
    print("Creating tables and buckets...")
    
    # Create tables
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
                raise

    # Add email indexes
    try:
        add_email_indexes()
    except ClientError as e:
        print(f"Error adding email indexes: {e}")
        raise

    # Create S3 buckets
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

    print("Tables and buckets created successfully!")

def verify_tables():
    """Verify that all required tables exist"""
    print("Verifying tables exist...")
    existing_tables = dynamodb.meta.client.list_tables()['TableNames']
    required_tables = set(TABLES.keys())
    
    if not required_tables.issubset(set(existing_tables)):
        missing_tables = required_tables - set(existing_tables)
        raise Exception(f"Missing tables: {missing_tables}")
    
    print("All tables verified!")

def insert_mock_data():
    """Insert mock data into all tables"""
    # Insert Skills
    skills_table = dynamodb.Table('Skills')
    skills = [
        {'skill_id': str(uuid.uuid4()), 'name': 'Python Programming', 'category': 'Programming'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Java Programming', 'category': 'Programming'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Web Development', 'category': 'Development'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Machine Learning', 'category': 'Data Science'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Communication Skills', 'category': 'Soft Skills'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Leadership', 'category': 'Soft Skills'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Teamwork', 'category': 'Soft Skills'},
        {'skill_id': str(uuid.uuid4()), 'name': 'Data Analysis', 'category': 'Data Science'}
    ]
    
    for skill in skills:
        try:
            skills_table.put_item(Item=skill)
            print(f"Inserted skill: {skill['name']}")
        except Exception as e:
            print(f"Error inserting skill {skill['name']}: {str(e)}")

    # Insert Users
    users_table = dynamodb.Table('Users')
    users = [
        {
            'user_id': str(uuid.uuid4()),
            'email': 'john.doe@example.com',
            'password': 'password123',
            'full_name': 'John Doe',
            'age': 20,
            'location': 'Mumbai',
            'created_at': datetime.now().isoformat()
        },
        {
            'user_id': str(uuid.uuid4()),
            'email': 'jane.smith@example.com',
            'password': 'password123',
            'full_name': 'Jane Smith',
            'age': 22,
            'location': 'Delhi',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    for user in users:
        try:
            users_table.put_item(Item=user)
            print(f"Inserted user: {user['full_name']}")
        except Exception as e:
            print(f"Error inserting user {user['full_name']}: {str(e)}")

    # Insert UserSkills
    user_skills_table = dynamodb.Table('UserSkills')
    user_skills = [
        {'user_id': users[0]['user_id'], 'skill_id': skills[0]['skill_id'], 'proficiency': 'intermediate'},
        {'user_id': users[0]['user_id'], 'skill_id': skills[2]['skill_id'], 'proficiency': 'beginner'},
        {'user_id': users[1]['user_id'], 'skill_id': skills[1]['skill_id'], 'proficiency': 'advanced'},
        {'user_id': users[1]['user_id'], 'skill_id': skills[3]['skill_id'], 'proficiency': 'intermediate'}
    ]
    
    for user_skill in user_skills:
        try:
            user_skills_table.put_item(Item=user_skill)
            print(f"Inserted user skill for user: {user_skill['user_id']}")
        except Exception as e:
            print(f"Error inserting user skill: {str(e)}")

    # Insert NGOs
    ngos_table = dynamodb.Table('NGOs')
    ngos = [
        {
            'ngo_id': str(uuid.uuid4()),
            'email': 'lighthouse@example.com',
            'password': 'password123',
            'organization_name': 'Lighthouse Community',
            'location': 'Pune',
            'description': 'Empowering youth through education',
            'created_at': datetime.now().isoformat()
        },
        {
            'ngo_id': str(uuid.uuid4()),
            'email': 'youth@example.com',
            'password': 'password123',
            'organization_name': 'Youth Empowerment Foundation',
            'location': 'Bangalore',
            'description': 'Creating opportunities for young people',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    for ngo in ngos:
        try:
            ngos_table.put_item(Item=ngo)
            print(f"Inserted NGO: {ngo['organization_name']}")
        except Exception as e:
            print(f"Error inserting NGO {ngo['organization_name']}: {str(e)}")

    # Insert Videos
    videos_table = dynamodb.Table('Videos')
    videos = [
        {
            'video_id': str(uuid.uuid4()),
            'ngo_id': ngos[0]['ngo_id'],
            'title': 'Introduction to Python',
            'description': 'Learn Python basics',
            'video_url': f'https://{VIDEO_BUCKET}.s3.ap-south-1.amazonaws.com/python-intro.mp4',
            'created_at': datetime.now().isoformat()
        },
        {
            'video_id': str(uuid.uuid4()),
            'ngo_id': ngos[1]['ngo_id'],
            'title': 'Web Development Fundamentals',
            'description': 'Learn HTML, CSS, and JavaScript',
            'video_url': f'https://{VIDEO_BUCKET}.s3.ap-south-1.amazonaws.com/web-dev-fundamentals.mp4',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    for video in videos:
        try:
            videos_table.put_item(Item=video)
            print(f"Inserted video: {video['title']}")
        except Exception as e:
            print(f"Error inserting video {video['title']}: {str(e)}")

    # Insert VideoSkills
    video_skills_table = dynamodb.Table('VideoSkills')
    video_skills = [
        {'video_id': videos[0]['video_id'], 'skill_id': skills[0]['skill_id']},
        {'video_id': videos[1]['video_id'], 'skill_id': skills[2]['skill_id']}
    ]
    
    for video_skill in video_skills:
        try:
            video_skills_table.put_item(Item=video_skill)
            print(f"Inserted video skill for video: {video_skill['video_id']}")
        except Exception as e:
            print(f"Error inserting video skill: {str(e)}")

    # Insert Jobs
    jobs_table = dynamodb.Table('Jobs')
    jobs = [
        {
            'job_id': str(uuid.uuid4()),
            'ngo_id': ngos[0]['ngo_id'],
            'title': 'Python Developer Intern',
            'description': 'Internship for Python developers',
            'requirements': ['Python', 'Basic SQL'],
            'location': 'Pune',
            'pdf_url': f'https://{JOB_PDF_BUCKET}.s3.ap-south-1.amazonaws.com/python-intern.pdf',
            'created_at': datetime.now().isoformat()
        },
        {
            'job_id': str(uuid.uuid4()),
            'ngo_id': ngos[1]['ngo_id'],
            'title': 'Web Development Trainer',
            'description': 'Trainer for web development courses',
            'requirements': ['HTML', 'CSS', 'JavaScript'],
            'location': 'Bangalore',
            'pdf_url': f'https://{JOB_PDF_BUCKET}.s3.ap-south-1.amazonaws.com/web-trainer.pdf',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    for job in jobs:
        try:
            jobs_table.put_item(Item=job)
            print(f"Inserted job: {job['title']}")
        except Exception as e:
            print(f"Error inserting job {job['title']}: {str(e)}")

    # Insert UserQuizScores
    user_quiz_scores_table = dynamodb.Table('UserQuizScores')
    quiz_scores = [
        {
            'user_id': users[0]['user_id'],
            'video_id': videos[0]['video_id'],
            'score': 85,
            'attempts': 2,
            'last_attempt': datetime.now().isoformat()
        },
        {
            'user_id': users[1]['user_id'],
            'video_id': videos[1]['video_id'],
            'score': 90,
            'attempts': 1,
            'last_attempt': datetime.now().isoformat()
        }
    ]
    
    for quiz_score in quiz_scores:
        try:
            user_quiz_scores_table.put_item(Item=quiz_score)
            print(f"Inserted quiz score for user: {quiz_score['user_id']}")
        except Exception as e:
            print(f"Error inserting quiz score: {str(e)}")

    print("Mock data insertion completed!")

def add_email_indexes():
    """Add email indexes to Users and NGOs tables if they don't exist"""
    try:
        # Check if email index exists for Users table
        users_table = dynamodb.Table('Users')
        try:
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
        except ClientError as e:
            if e.response['Error']['Code'] != 'ValidationException' or 'already exists' not in str(e):
                raise

        # Check if email index exists for NGOs table
        ngos_table = dynamodb.Table('NGOs')
        try:
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
            if e.response['Error']['Code'] != 'ValidationException' or 'already exists' not in str(e):
                raise
    except ClientError as e:
        print(f"Error adding email indexes: {e}")
        raise

if __name__ == '__main__':
    create_tables_and_buckets()
    verify_tables()
    insert_mock_data() 