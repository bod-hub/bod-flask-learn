import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

def backup_database():
    # Load environment variables
    load_dotenv()
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
        return

    # Initialize Supabase client
    supabase = create_client(url, key)
    
    # Tables to backup
    tables = ['sections', 'lessons']
    backup_data = {}
    
    print(f"Starting backup from {url}...")
    
    for table in tables:
        print(f"Fetching table: {table}...")
        try:
            # Fetch all records from the table
            # Note: For very large tables, we might need pagination, 
            # but for this project it should be fine.
            data = supabase.table(table).select('*').execute().data
            backup_data[table] = data
            print(f"Successfully fetched {len(data)} records from {table}.")
        except Exception as e:
            print(f"Error fetching table {table}: {e}")
            backup_data[table] = None

    # Create backups directory if it doesn't exist
    backup_dir = 'backups'
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"Created directory: {backup_dir}")

    # Save to timestamped JSON file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(backup_dir, f"backup_{timestamp}.json")
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=4)
    
    print(f"\nBackup complete! Saved to: {filename}")
    return filename

if __name__ == "__main__":
    backup_database()
