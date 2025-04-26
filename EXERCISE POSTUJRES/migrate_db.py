#!/usr/bin/env python
"""
Database migration script for AI Fitness Trainer
This script alters the database to add new user fields
"""

import sqlite3
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def migrate_database():
    """Migrate the database to add new user fields"""
    print("Checking if database migration is needed...")
    
    # Path to the database file
    db_file = "exercise.db"
    
    if not os.path.exists(db_file):
        print(f"Database file {db_file} not found. No migration needed.")
        return False
    
    # Check if columns already exist
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Get the current columns in the users table
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    # Check if any of our new columns are missing
    new_columns = [
        "fitness_goals", 
        "experience_level", 
        "preferred_workout_days", 
        "profile_picture_url"
    ]
    
    missing_columns = [col for col in new_columns if col not in column_names]
    
    if not missing_columns:
        print("Database is already up to date. No migration needed.")
        conn.close()
        return False
    
    print(f"Found {len(missing_columns)} columns to add: {missing_columns}")
    
    # Add the missing columns
    for column in missing_columns:
        data_type = "TEXT"
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column} {data_type}")
            print(f"Added column {column} to users table")
        except sqlite3.OperationalError as e:
            print(f"Error adding column {column}: {e}")
    
    conn.commit()
    conn.close()
    
    print("Database migration completed successfully.")
    return True

if __name__ == "__main__":
    migrate_database() 