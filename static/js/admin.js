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
    // Setup CKEditor Helper
    const pluginMap = new Map();
    if (typeof CKEDITOR !== 'undefined' && CKEDITOR.ClassicEditor && CKEDITOR.ClassicEditor.builtinPlugins) {
        CKEDITOR.ClassicEditor.builtinPlugins.forEach(p => {
            if (p.pluginName) pluginMap.set(p.pluginName, p);
        });
    }

    function getPlugin(name) {
        if (CKEDITOR[name]) return CKEDITOR[name];
        if (pluginMap.has(name)) return pluginMap.get(name);
        if (name === 'Image' && pluginMap.has('ImageBlock')) return pluginMap.get('ImageBlock');
        if (name !== 'FileRepository') console.warn(`Plugin ${name} not found.`);
        return undefined;
    }

    function getEditorConfig() {
        return {
            plugins: [
                getPlugin('Essentials'), getPlugin('Paragraph'), getPlugin('Heading'),
                getPlugin('Bold'), getPlugin('Italic'), getPlugin('Link'),
                getPlugin('List'), getPlugin('Indent'), getPlugin('BlockQuote'),
                getPlugin('Image'), getPlugin('ImageCaption'), getPlugin('ImageStyle'),
                getPlugin('ImageToolbar'), getPlugin('ImageUpload'), getPlugin('ImageResize'),
                getPlugin('FileRepository'), getPlugin('MediaEmbed'), getPlugin('Code'),
                getPlugin('CodeBlock'), getPlugin('HtmlEmbed'), getPlugin('SourceEditing'),
                getPlugin('GeneralHtmlSupport'), getPlugin('FontSize'), getPlugin('FontFamily'),
                getPlugin('FontColor'), getPlugin('FontBackgroundColor'), getPlugin('Alignment')
            ].filter(p => p !== undefined),
            extraPlugins: [MyCustomUploadAdapterPlugin],
            mediaEmbed: { previewsInData: true },
            codeBlock: {
                languages: [
                    { language: 'python', label: 'Python' },
                    { language: 'jinja2', label: 'Djinja2' },
                    { language: 'css', label: 'CSS' }
                ]
            },
            toolbar: {
                items: [
                    'heading', '|',
                    'fontColor', 'fontBackgroundColor', '|',
                    'bold', 'italic', 'code', 'codeBlock', 'link', '|',
                    'alignment', 'imageUpload', 'mediaEmbed', '|',
                    'undo', 'redo', 'sourceEditing'
                ],
                shouldNotGroupWhenFull: true
            },
            fontSize: {
                options: [
                    8, 10, 12, 14, 'default', 18, 20, 24, 30
                ],
                supportAllValues: true
            },
            fontFamily: {
                options: [
                    'default',
                    'Arial, Helvetica, sans-serif',
                    'Courier New, Courier, monospace',
                    'Georgia, serif',
                    'Lucida Sans Unicode, Lucida Grande, sans-serif',
                    'Tahoma, Geneva, sans-serif',
                    'Times New Roman, Times, serif',
                    'Trebuchet MS, Helvetica, sans-serif',
                    'Verdana, Geneva, sans-serif'
                ],
                supportAllValues: true
            },
            image: {
                toolbar: ['imageTextAlternative', 'toggleImageCaption', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side']
            },
            htmlSupport: {
                allow: [{ name: /.*/, attributes: true, classes: true, styles: true }]
            }
        };
    }

    // Init Theory Editor
    const editors = ['theory_editor'];
    editors.forEach(id => {
        if (document.querySelector('#' + id)) {
            CKEDITOR.ClassicEditor.create(document.querySelector('#' + id), getEditorConfig())
                .catch(error => console.error(error));
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
    // Tasks Builder Logic
    const tasksContainer = document.getElementById('tasks-container');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksInput = document.getElementById('tasks-json');
    const taskEditors = new Map(); // id -> editor instance

    if (tasksContainer && typeof INITIAL_TASKS !== 'undefined') {
        let tasks = INITIAL_TASKS; // Array of {id, content}

        async function renderAllTasks() {
            // Save current state
            tasks.forEach(task => {
                if (taskEditors.has(task.id)) {
                    task.content = taskEditors.get(task.id).getData();
                    taskEditors.get(task.id).destroy();
                }
            });
            taskEditors.clear();
            tasksContainer.innerHTML = '';

            // Rebuild
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                if (!task.id) task.id = i + 1; // Ensure ID exists

                const el = document.createElement('div');
                el.className = 'test-item';
                el.innerHTML = `
                   <button type="button" class="btn-remove-test" onclick="removeTask(${i})">×</button>
                   <div class="form-group">
                       <label>Задача ${i + 1}</label>
                       <textarea id="task-area-${i}">${task.content || ''}</textarea>
                   </div>
                `;
                tasksContainer.appendChild(el);

                const editor = await CKEDITOR.ClassicEditor.create(el.querySelector(`#task-area-${i}`), getEditorConfig())
                    .catch(e => console.error(e));
                if (editor) {
                    taskEditors.set(task.id, editor);
                }
            }
            updateTasksInput();
        }

        window.addTask = async () => {
            // Save current state before adding
            tasks.forEach(task => {
                if (taskEditors.has(task.id)) {
                    task.content = taskEditors.get(task.id).getData();
                }
            });

            const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id || 0)) + 1 : 1;
            tasks.push({ id: newId, content: '' });
            await renderAllTasks();
        };

        window.removeTask = async (index) => {
            // Save current state before removing
            tasks.forEach(task => {
                if (taskEditors.has(task.id)) {
                    task.content = taskEditors.get(task.id).getData();
                }
            });
            tasks.splice(index, 1);
            await renderAllTasks();
        };

        function updateTasksInput() {
            const data = tasks.map(t => {
                if (taskEditors.has(t.id)) {
                    return { id: t.id, content: taskEditors.get(t.id).getData() };
                }
                return t;
            });
            tasksInput.value = JSON.stringify(data);
        }

        addTaskBtn.addEventListener('click', window.addTask);

        // Initial Render
        renderAllTasks();

        if (form) {
            form.addEventListener('submit', () => {
                updateTasksInput();
            });
        }
    }
});
