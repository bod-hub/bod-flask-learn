from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
import json
import uuid
from crud import (
    perform_admin_login, get_sections, get_lessons_by_section,
    create_section, update_section, delete_section, get_section_by_id,
    create_lesson, update_lesson, delete_lesson, get_lesson_by_id,
    upload_image
)

admin_bp = Blueprint('admin', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('login')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        if perform_admin_login(username, password):
            session['admin_logged_in'] = True
            session.permanent = remember
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Неверный логин или пароль', 'error')
            
    return render_template('admin/login.html')

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    sections = get_sections()
    # Populate lessons
    if sections:
        for section in sections:
             # get_lessons_by_section returns basic info which is enough for dashboard
             section['lessons'] = get_lessons_by_section(section['id'])
    return render_template('admin/dashboard.html', sections=sections)

@admin_bp.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin.login'))

# --- Section Routes ---
@admin_bp.route('/section/create', methods=['GET', 'POST'])
@login_required
def create_section_view():
    if request.method == 'POST':
        try:
            create_section(
                int(request.form['number']),
                request.form['name'],
                request.form['slug']
            )
            flash('Раздел создан', 'success')
            return redirect(url_for('admin.dashboard'))
        except Exception as e:
            flash(f'Ошибка: {str(e)}', 'error')
            
    return render_template('admin/editor_section.html', section=None)

@admin_bp.route('/section/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_section(id):
    section = get_section_by_id(id)
    if not section:
        flash('Раздел не найден', 'error')
        return redirect(url_for('admin.dashboard'))
        
    if request.method == 'POST':
        try:
            update_section(id, {
                "number": int(request.form['number']),
                "name": request.form['name'],
                "slug": request.form['slug']
            })
            flash('Раздел обновлен', 'success')
            return redirect(url_for('admin.dashboard'))
        except Exception as e:
            flash(f'Ошибка: {str(e)}', 'error')

    return render_template('admin/editor_section.html', section=section)

@admin_bp.route('/section/delete/<int:id>', methods=['POST'])
@login_required
def delete_section_view(id):
    try:
        delete_section(id)
        flash('Раздел удален', 'success')
    except Exception as e:
        flash(f'Ошибка: {str(e)}', 'error')
    return redirect(url_for('admin.dashboard'))

# --- Lesson Routes ---
@admin_bp.route('/lesson/create', methods=['GET', 'POST'])
@login_required
def create_lesson_view():
    section_id = request.args.get('section_id')
    
    if request.method == 'POST':
        try:
            # Construct content JSON
            content = {
                "theory_html": request.form['theory_html'],
                "tasks": json.loads(request.form['tasks']),
                "tests": json.loads(request.form['tests'])
            }
            res = create_lesson(
                int(request.form['section_id']),
                int(request.form['number']),
                request.form['name'],
                request.form['slug'],
                content,
                request.form.get('action') == 'publish'
            )
            flash('Урок создан', 'success')
            
            if request.form.get('action') == 'draft':
                # Get the newly created lesson ID to stay in editor
                new_lesson = res.data[0]
                return redirect(url_for('admin.edit_lesson', id=new_lesson['id']))
                
            return redirect(url_for('admin.dashboard'))
        except Exception as e:
            flash(f'Ошибка создания: {str(e)}', 'error')

    # Needed for dropdown
    sections = get_sections()
    return render_template('admin/editor_lesson.html', lesson=None, sections=sections, default_section_id=section_id)

@admin_bp.route('/lesson/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_lesson(id):
    lesson = get_lesson_by_id(id)
    if not lesson:
         flash('Урок не найден', 'error')
         return redirect(url_for('admin.dashboard'))
         
    if request.method == 'POST':
        try:
            content = {
                "theory_html": request.form['theory_html'],
                "tasks": json.loads(request.form['tasks']),
                "tests": json.loads(request.form['tests'])
            }
            update_lesson(id, {
                "section_id": int(request.form['section_id']),
                "number": int(request.form['number']),
                "name": request.form['name'],
                "slug": request.form['slug'],
                "content": content,
                "is_published": request.form.get('action') == 'publish'
            })
            flash('Урок обновлен', 'success')
            
            if request.form.get('action') == 'draft':
                return redirect(url_for('admin.edit_lesson', id=id))
                
            return redirect(url_for('admin.dashboard'))
        except Exception as e:
            flash(f'Ошибка обновления: {str(e)}', 'error')
            
    sections = get_sections()
    return render_template('admin/editor_lesson.html', lesson=lesson, sections=sections)

@admin_bp.route('/lesson/delete/<int:id>', methods=['POST'])
@login_required
def delete_lesson_view(id):
    try:
        delete_lesson(id)
        flash('Урок удален', 'success')
    except Exception as e:
        flash(f'Ошибка: {str(e)}', 'error')
    return redirect(url_for('admin.dashboard'))

# --- Upload Route ---
@admin_bp.route('/upload', methods=['POST'])
@login_required
def upload():
    if 'upload' not in request.files:
        return jsonify({"error": {"message": "No file uploaded"}}), 400
        
    f = request.files['upload']
    if f.filename == '':
        return jsonify({"error": {"message": "No filename"}}), 400
        
    # Generate unique name to prevent collision
    ext = f.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    
    try:
        # Read file as bytes
        file_bytes = f.read()
        public_url = upload_image(file_bytes, unique_filename, f.content_type)
        return jsonify({"url": public_url})
    except Exception as e:
        return jsonify({"error": {"message": str(e)}}), 500
