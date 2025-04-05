import pandas as pd
import time
import random
import boto3

# Initialize the S3 resource with your credentials
s3 = boto3.resource('s3',
                    aws_access_key_id="AKIATUFKOFCQCDOSI4NI",
                    aws_secret_access_key="mZIEXtQDE4Tt7I4TCLb0si48TyY0LKqMBf5F4VmG",
                    region_name="ap-south-1"
                   )


def AllBucketName():
    print("All S3 bucket names: ")
    for bucket in s3.buckets.all():
        print(f"{bucket.name}")


def putFile():
    bucket_name = 'rsh1232'
    s3_object_key = 'syn.csv'
    local_file_path = 'BH2S (1).csv'
    s3.Bucket(bucket_name).upload_file(local_file_path, s3_object_key)


def downloadFile():
    bucket_name = 'rsh1232'
    s3_object_key = 'syn.csv'
    local_file_path = 'synthetic_industrial_data.csv'
    s3.Bucket(bucket_name).download_file(s3_object_key, local_file_path)
    print(f'File {s3_object_key} downloaded from s3 bucket {bucket_name} to {local_file_path}')

# Call the functions
AllBucketName()
