from dotenv import load_dotenv

import psycopg2
import os

load_dotenv()

def db_connect() :
    db = psycopg2.connect(host='localhost', 
                          dbname='bookforyourchild',
                          user='postgres',
                          password=os.getenv('DB_PASSWORD'),
                          port=5433)

    return db