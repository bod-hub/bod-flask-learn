class UploadAdapter {
    constructor(loader) {
        this.loader = loader;
    }

    upload() {
        return this.loader.file
            .then(file => new Promise((resolve, reject) => {
                this._initRequest();
                this._initListeners(resolve, reject, file);
                this._sendRequest(file);
            }));
    }

    abort() {
        if (this.xhr) {
            this.xhr.abort();
        }
    }

    _initRequest() {
        const xhr = this.xhr = new XMLHttpRequest();
        xhr.open('POST', '/bod/upload', true);
        xhr.responseType = 'json';
    }

    _initListeners(resolve, reject, file) {
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = `Couldn't upload file: ${file.name}.`;

        xhr.addEventListener('error', () => reject(genericErrorText));
        xhr.addEventListener('abort', () => reject());
        xhr.addEventListener('load', () => {
            const response = xhr.response;

            if (!response || response.error) {
                return reject(response && response.error ? response.error.message : genericErrorText);
            }

            resolve({
                default: response.url
            });
        });

        if (xhr.upload) {
            xhr.upload.addEventListener('progress', evt => {
                if (evt.lengthComputable) {
                    loader.uploadTotal = evt.total;
                    loader.uploaded = evt.loaded;
                }
            });
        }
    }

    _sendRequest(file) {
        const data = new FormData();
        data.append('upload', file);
        this.xhr.send(data);
    }
}

function MyCustomUploadAdapterPlugin(editor) {
    if (editor.plugins.has('FileRepository')) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new UploadAdapter(loader);
        };
    }
}

// Init CKEditors
document.addEventListener('DOMContentLoaded', () => {
    const editors = ['theory_editor', 'task_editor'];

    editors.forEach(id => {
        if (document.querySelector('#' + id)) {
            // Using CKEditor 5 Superbuild
            // Superbuild: Plugins might be in builtinPlugins if not global
            const pluginMap = new Map();
            if (CKEDITOR.ClassicEditor && CKEDITOR.ClassicEditor.builtinPlugins) {
                CKEDITOR.ClassicEditor.builtinPlugins.forEach(p => {
                    if (p.pluginName) {
                        pluginMap.set(p.pluginName, p);
                    }
                });
            }

            // Helper to get plugin by name
            function getPlugin(name) {
                // Check Global
                if (CKEDITOR[name]) return CKEDITOR[name];
                // Check Map
                if (pluginMap.has(name)) return pluginMap.get(name);
                // Fallbacks/Aliases for Superbuild 40+
                if (name === 'Image' && pluginMap.has('ImageBlock')) return pluginMap.get('ImageBlock');

                if (name !== 'FileRepository') {
                    console.warn(`Plugin ${name} not found.`);
                }
                return undefined;
            }

            CKEDITOR.ClassicEditor
                .create(document.querySelector('#' + id), {
                    plugins: [
                        getPlugin('Essentials'),
                        getPlugin('Paragraph'),
                        getPlugin('Heading'),
                        getPlugin('Bold'),
                        getPlugin('Italic'),
                        getPlugin('Link'),
                        getPlugin('List'),
                        getPlugin('Indent'),
                        getPlugin('BlockQuote'),
                        getPlugin('Image'), // Will try ImageBlock if Image missing
                        getPlugin('ImageCaption'),
                        getPlugin('ImageStyle'),
                        getPlugin('ImageToolbar'),
                        getPlugin('ImageUpload'),
                        getPlugin('ImageResize'),
                        getPlugin('FileRepository'),
                        getPlugin('MediaEmbed'),
                        getPlugin('Code'),
                        getPlugin('CodeBlock'),
                        getPlugin('HtmlEmbed'),
                        getPlugin('SourceEditing'),
                        getPlugin('GeneralHtmlSupport')
                    ].filter(p => p !== undefined),
                    extraPlugins: [MyCustomUploadAdapterPlugin],
                    mediaEmbed: { previewsInData: true },
                    toolbar: {
                        items: ['heading', '|', 'bold', 'italic', 'code', 'codeBlock', 'link', '|', 'bulletedList', 'numberedList', '|', 'imageUpload', 'mediaEmbed', '|', 'undo', 'redo', 'sourceEditing'],
                        shouldNotGroupWhenFull: true
                    },
                    // Image Config to properly handle uploads and toolbar
                    image: {
                        toolbar: [
                            'imageTextAlternative',
                            'toggleImageCaption',
                            'imageStyle:inline',
                            'imageStyle:block',
                            'imageStyle:side'
                        ]
                    },
                    htmlSupport: {
                        allow: [
                            {
                                name: /.*/,
                                attributes: true,
                                classes: true,
                                styles: true
                            }
                        ]
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    });

    // Test Builder Logic
    const testsContainer = document.getElementById('tests-container');
    const addTestBtn = document.getElementById('add-test-btn');
    const testsInput = document.getElementById('tests-json');
    const form = document.getElementById('lessonForm'); // Ensure id matches

    if (testsContainer && typeof INITIAL_TESTS !== 'undefined') {
        let tests = INITIAL_TESTS; // Array of {id, question, options:[], correct_index}

        function renderTests() {
            testsContainer.innerHTML = '';
            tests.forEach((test, index) => {
                const el = document.createElement('div');
                el.className = 'test-item';
                el.innerHTML = `
                    <button type="button" class="btn-remove-test" onclick="removeTest(${index})">×</button>
                    <div class="form-group" style="margin-bottom: 0.5rem;">
                        <input type="text" placeholder="Вопрос" value="${test.question}" onchange="updateTest(${index}, 'question', this.value)" required>
                    </div>
                    <div class="test-options-grid">
                        ${test.options.map((opt, optIndex) => `
                            <input type="radio" name="correct_${index}" ${test.correct_index == optIndex ? 'checked' : ''} onchange="updateTest(${index}, 'correct_index', ${optIndex})">
                            <input type="text" placeholder="Вариант ${optIndex + 1}" value="${opt}" onchange="updateTestOption(${index}, ${optIndex}, this.value)" required>
                        `).join('')}
                    </div>
                `;
                testsContainer.appendChild(el);
            });
            updateHiddenInput();
        }

        window.addTest = () => {
            const newId = tests.length > 0 ? Math.max(...tests.map(t => t.id)) + 1 : 1;
            tests.push({
                id: newId,
                question: '',
                options: ['', '', '', ''],
                correct_index: 0
            });
            renderTests();
        };

        window.removeTest = (index) => {
            tests.splice(index, 1);
            renderTests();
        };

        window.updateTest = (index, field, value) => {
            tests[index][field] = value;
            updateHiddenInput();
        };

        window.updateTestOption = (testIndex, optIndex, value) => {
            tests[testIndex].options[optIndex] = value;
            updateHiddenInput();
        };

        function updateHiddenInput() {
            testsInput.value = JSON.stringify(tests);
        }

        addTestBtn.addEventListener('click', window.addTest);

        // Initial render
        renderTests();

        // On submit, update hidden input one last time to be sure
        if (form) {
            form.addEventListener('submit', () => {
                updateHiddenInput();
            });
        }
    }
});
