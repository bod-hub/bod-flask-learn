from flask import Blueprint, render_template, abort
from crud import get_sections, get_section_by_slug, get_lesson_by_slugs, get_lessons_by_section

public_bp = Blueprint('public', __name__)

@public_bp.route('/')
def index():
    sections = get_sections()
    # For each section, we might want to fetch lessons to show in the card, 
    # but for now let's just show sections.
    # Actually requirements say: "Внутри карточки раздела должны быть кликабельные заголовки уроков"
    # So we need to fetch lessons for each section.
    # Optimization: One query to fetch all sections and lessons if possible, or loop.
    # Given low volume (5 sections), looping is acceptable.
    sections_data = []
    if sections:
        for section in sections:
            lessons = get_lessons_by_section(section['id'])
            # Sort lessons just in case
            lessons.sort(key=lambda x: x['number'])
            section['lessons'] = lessons
            sections_data.append(section)
            
    return render_template('section_list.html', sections=sections_data)

@public_bp.route('/section-<int:section_number>-<string:section_slug>/')
def section_view(section_number, section_slug):
    section = get_section_by_slug(section_slug)
    if not section or section['number'] != section_number:
        abort(404)
        
    lessons = get_lessons_by_section(section['id'])
    return render_template('section.html', section=section, lessons=lessons)

@public_bp.route('/section-<int:section_number>-<string:section_slug>/lesson-<int:lesson_number>-<string:lesson_slug>')
def lesson_view(section_number, section_slug, lesson_number, lesson_slug):
    # Verify section matches
    section = get_section_by_slug(section_slug)
    if not section or section['number'] != section_number:
        abort(404)

    lesson = get_lesson_by_slugs(section_slug, lesson_slug)
    if not lesson or lesson['number'] != lesson_number:
        abort(404)

    # Need adjacent lessons for navigation
    all_lessons = get_lessons_by_section(section['id'])
    # logic to find prev/next
    prev_lesson = None
    next_lesson = None
    
    for i, l in enumerate(all_lessons):
        if l['id'] == lesson['id']:
            if i > 0:
                prev_lesson = all_lessons[i-1]
            if i < len(all_lessons) - 1:
                next_lesson = all_lessons[i+1]
            break
            
    return render_template('lesson.html', 
                           section=section, 
                           lesson=lesson, 
                           prev_lesson=prev_lesson, 
                           next_lesson=next_lesson)

