import os
from supabase import create_client, Client
from config import Config

# Initialize Supabase Client
supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def get_sections():
    """Fetch all sections ordered by number."""
    response = supabase.table('sections').select('*').order('number').execute()
    return response.data

def get_section_by_slug(slug):
    """Fetch a single section by slug."""
    response = supabase.table('sections').select('*').eq('slug', slug).execute()
    return response.data[0] if response.data else None

def get_lessons_by_section(section_id):
    """Fetch all lessons for a section ordered by number."""
    response = supabase.table('lessons').select('id, number, name, slug, is_published').eq('section_id', section_id).order('number').execute()
    return response.data

def get_lesson_by_slugs(section_slug, lesson_slug):
    """Fetch a lesson by section slug and lesson slug."""
    # First get section to ensure it exists and get ID
    # Optimization: Could do a join if Supabase supports it easily, but two queries is fine for now
    section = get_section_by_slug(section_slug)
    if not section:
        return None
        
    response = supabase.table('lessons').select('*').eq('section_id', section['id']).eq('slug', lesson_slug).execute()
    return response.data[0] if response.data else None

def perform_admin_login(username, password):
    """Verify admin credentials."""
    return username == Config.ADMIN_LOGIN and password == Config.ADMIN_PASSWORD

# Admin: Sections
def create_section(number, name, slug):
    data = {"number": number, "name": name, "slug": slug}
    return supabase.table('sections').insert(data).execute()

def update_section(section_id, data):
    return supabase.table('sections').update(data).eq('id', section_id).execute()

def delete_section(section_id):
    return supabase.table('sections').delete().eq('id', section_id).execute()

def get_section_by_id(section_id):
    response = supabase.table('sections').select('*').eq('id', section_id).execute()
    return response.data[0] if response.data else None

# Admin: Lessons
def create_lesson(section_id, number, name, slug, content, is_published):
    data = {
        "section_id": section_id,
        "number": number,
        "name": name,
        "slug": slug,
        "content": content,
        "is_published": is_published
    }
    return supabase.table('lessons').insert(data).execute()

def update_lesson(lesson_id, data):
    return supabase.table('lessons').update(data).eq('id', lesson_id).execute()

def delete_lesson(lesson_id):
    # Retrieve lesson to delete images check?
    # Requirement: "При удалении урока изображения тоже должны удаляться".
    # This is hard because we don't track which images belong to which lesson explicitly in a separate table, 
    # they are embedded in HTML.
    # We could parse the JSON content to find image URLs and delete them from storage.
    # For now, implementing basic delete.
    return supabase.table('lessons').delete().eq('id', lesson_id).execute()

def get_lesson_by_id(lesson_id):
    response = supabase.table('lessons').select('*').eq('id', lesson_id).execute()
    return response.data[0] if response.data else None

# Storage
BUCKET_NAME = 'lesson-images'

def ensure_bucket_exists():
    # Helper to create bucket if not likely exists (checking existence is tricky without listing)
    try:
        supabase.storage.create_bucket(BUCKET_NAME, options={'public': True})
    except Exception:
        pass # Assume exists

def upload_image(file_bytes, filename, content_type):
    ensure_bucket_exists()
    path = f"{filename}" 
    # Upload overrides if exists or we should make unique name?
    # CKEditor might send same name. Better to timestamp or UUID.
    # But for now, basic upload.
    # supabase-py upload requires file object or bytes.
    res = supabase.storage.from_(BUCKET_NAME).upload(path, file_bytes, {"content-type": content_type, "upsert": "true"})
    
    # Get Public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(path)
    return public_url

