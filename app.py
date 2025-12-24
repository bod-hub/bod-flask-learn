from flask import Flask
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Register Blueprints (will add imports later)
    from routes_public import public_bp
    from routes_admin import admin_bp
    
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix='/bod')
    
    @app.route('/health')
    def health():
        return "OK", 200

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('404.html'), 404

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
