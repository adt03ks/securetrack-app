
(() => {
'use strict';

const $ = id => document.getElementById(id);
const bucket = 'st-training-media';

let db;
let active;
let lessons = [];
let questions = [];
let editingLesson = null;

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

function option(value, text) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = text;
  return element;
}

function el(tag, text, klass) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (klass) node.className = klass;
  return node;
}

function errorMessage(error) {
  status(error?.message || String(error), true);
}

async function must(result) {
  if (result.error) throw result.error;
  return result.data;
}

function fillModule() {
  if (!active) return;

  $('modtitle').value = active.title;
  $('moddesc').value = active.description || '';
  $('passing').value = active.passing_score;
  $('published').checked = active.is_published;
}

async function listModules() {
  const rows = await must(
    await db.from('st_training_modules')
      .select('*')
      .order('sort_order')
  );

  $('module').replaceChildren(
    ...rows.map(row => option(row.id, row.title))
  );

  if (!rows.length) {
    status(
      'No modules available. Run the original training foundation SQL.',
      true
    );
    return;
  }

  await selectModule(rows[0].id);
}

async function selectModule(id) {
  active = await must(
    await db.from('st_training_modules')
      .select('*')
      .eq('id', id)
      .single()
  );

  $('module').value = id;
  fillModule();
  clearLesson();

  await Promise.all([
    loadLessons(),
    loadQuestions()
  ]);
}

function clearLesson() {
  editingLesson = null;

  $('lesson-form-title').textContent =
    'Add lesson step';

  $('lesson-title').value = '';
  $('lesson-body').value = '';
  $('lesson-position').value = 10;
  $('lesson-file').value = '';
}

async function signedMedia(path) {
  if (!path) return null;

  const data = await must(
    await db.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
  );

  return data.signedUrl;
}

async function loadLessons() {
  lessons = await must(
    await db.from('st_training_lessons')
      .select('*')
      .eq('module_id', active.id)
      .order('position')
      .order('created_at')
  );

  const host = $('lessons');
  host.replaceChildren();

  if (!lessons.length) {
    host.append(
      el('p', 'No lesson steps yet.', 'hint')
    );
  }

  for (const lesson of lessons) {
    const wrap = el('div', undefined, 'item');

    wrap.append(
      el(
        'strong',
        `${lesson.position}. ${lesson.title}`
      ),
      el('p', lesson.body || '', 'hint')
    );

    if (lesson.media_path) {
      try {
        const url = await signedMedia(
          lesson.media_path
        );

        const media = document.createElement(
          lesson.media_type === 'video'
            ? 'video'
            : 'img'
        );

        media.className = 'preview';
        media.src = url;

        if (lesson.media_type === 'video') {
          media.controls = true;
        }

        media.alt = lesson.title;
        wrap.append(media);

      } catch (error) {
        wrap.append(
          el(
            'p',
            'Media preview unavailable',
            'hint'
          )
        );
      }
    }

    const edit = el(
      'button',
      'Edit',
      'secondary'
    );

    edit.onclick = () => {
      editingLesson = lesson.id;

      $('lesson-form-title').textContent =
        'Edit lesson step';

      $('lesson-title').value = lesson.title;
      $('lesson-body').value = lesson.body || '';
      $('lesson-position').value = lesson.position;
      $('lesson-file').value = '';

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    };

    const del = el(
      'button',
      'Delete',
      'danger'
    );

    del.onclick = async () => {
      if (!confirm('Delete this lesson step?')) {
        return;
      }

      try {
        await must(
          await db.from('st_training_lessons')
            .delete()
            .eq('id', lesson.id)
        );

        status('Lesson deleted.');
        await loadLessons();

      } catch (error) {
        errorMessage(error);
      }
    };

    wrap.append(edit, del);
    host.append(wrap);
  }
}

async function upload(file) {
  const allowed = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm'
  };

  if (!allowed[file.type]) {
    throw Error(
      'Only PNG, JPG, WEBP, MP4 and WEBM files are accepted.'
    );
  }

  if (file.size > 52428800) {
    throw Error(
      'Media file must be under 50 MB.'
    );
  }

  const path =
    `${active.id}/${crypto.randomUUID()}.${allowed[file.type]}`;

  await must(
    await db.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      })
  );

  return {
    path,
    type: file.type.startsWith('video/')
      ? 'video'
      : 'image'
  };
}

async function saveLesson() {
  const title = $('lesson-title').value.trim();

  if (!title) {
    throw Error('Enter a lesson title.');
  }

  const previous = lessons.find(
    lesson => lesson.id === editingLesson
  );

  const payload = {
    module_id: active.id,
    title,
    body: $('lesson-body').value.trim(),
    position:
      Number($('lesson-position').value) || 10
  };

  const file = $('lesson-file').files[0];

  if (file) {
    const media = await upload(file);
    payload.media_path = media.path;
    payload.media_type = media.type;

  } else if (previous) {
    payload.media_path = previous.media_path;
    payload.media_type = previous.media_type;
  }

  if (editingLesson) {
    await must(
      await db.from('st_training_lessons')
        .update(payload)
        .eq('id', editingLesson)
    );

  } else {
    await must(
      await db.from('st_training_lessons')
        .insert(payload)
    );
  }

  clearLesson();
  status('Lesson step saved.');
  await loadLessons();
}

async function loadQuestions() {
  questions = await must(
    await db.from('st_training_questions')
      .select('id,prompt,choices')
      .eq('module_id', active.id)
      .order('sort_order')
  );

  const host = $('questions');
  host.replaceChildren();

  if (!questions.length) {
    host.append(
      el('p', 'No questions yet.', 'hint')
    );
  }

  for (const question of questions) {
    const wrap = el(
      'div',
      undefined,
      'item'
    );

    wrap.append(
      el('strong', question.prompt),
      el(
        'p',
        question.choices
          .map(
            (choice, index) =>
              `${'ABCDEFGH'[index]}. ${choice}`
          )
          .join('  |  '),
        'hint'
      )
    );

    const del = el(
      'button',
      'Delete question',
      'danger'
    );

    del.onclick = async () => {
      if (!confirm('Delete this question?')) {
        return;
      }

      try {
        await must(
          await db.rpc(
            'st_training_delete_question',
            {
              p_question_id: question.id
            }
          )
        );

        status('Question deleted.');
        await loadQuestions();

      } catch (error) {
        errorMessage(error);
      }
    };

    wrap.append(del);
    host.append(wrap);
  }
}

async function saveQuestion() {
  const prompt =
    $('question-prompt').value.trim();

  const choices = [0, 1, 2, 3].map(
    index =>
      $(`choice-${index}`).value.trim()
  );

  if (
    prompt.length < 5 ||
    choices.some(choice => !choice)
  ) {
    throw Error(
      'Enter a question and all four answer choices.'
    );
  }

  await must(
    await db.rpc(
      'st_training_save_question',
      {
        p_module_id: active.id,
        p_prompt: prompt,
        p_choices: choices,
        p_correct_index:
          Number($('correct-index').value)
      }
    )
  );

  $('question-prompt').value = '';

  for (let index = 0; index < 4; index++) {
    $(`choice-${index}`).value = '';
  }

  status('Quiz question saved.');
  await loadQuestions();
}

async function saveModule() {
  const score = Number(
    $('passing').value
  );

  if (
    !Number.isInteger(score) ||
    score < 1 ||
    score > 100
  ) {
    throw Error(
      'Passing score must be 1–100.'
    );
  }

  const payload = {
    title: $('modtitle').value.trim(),
    description: $('moddesc').value.trim(),
    passing_score: score,
    is_published: $('published').checked,
    updated_at: new Date().toISOString()
  };

  if (!payload.title) {
    throw Error(
      'Module title required.'
    );
  }

  const selectedId = active.id;

  await must(
    await db.from('st_training_modules')
      .update(payload)
      .eq('id', selectedId)
  );

  status('Module settings saved.');

  await listModules();
  await selectModule(selectedId);
}

function wire() {
  $('module').addEventListener(
    'change',
    () => selectModule(
      $('module').value
    ).catch(errorMessage)
  );

  [
    ['save-lesson', saveLesson],
    ['save-question', saveQuestion],
    ['save-module', saveModule]
  ].forEach(([id, fn]) => {
    $(id).onclick = async () => {
      const btn = $(id);
      btn.disabled = true;

      try {
        await fn();
      } catch (error) {
        errorMessage(error);
      } finally {
        btn.disabled = false;
      }
    };
  });

  $('clear-lesson').onclick = clearLesson;

  const host = $('choice-fields');

  for (let index = 0; index < 4; index++) {
    const label = el(
      'label',
      `Choice ${'ABCD'[index]}`,
      'field'
    );

    label.htmlFor =
      `choice-${index}`;

    const input = el('input');
    input.id = `choice-${index}`;

    host.append(
      label,
      input
    );
  }
}

async function start(auth) {
  try {
    db = auth.db;

    const {
      data,
      error
    } = await db.rpc(
      'st_training_is_admin'
    );

    if (error) {
      throw error;
    }

    if (data !== true) {
      throw Error(
        'Administrator role required.'
      );
    }

    wire();

    $('app').classList.remove('hidden');

    status(
      'Administrator access verified.'
    );

    await listModules();

  } catch (error) {
    errorMessage(error);
  }
}

if (window.SecureTrackAuth) {
  start(window.SecureTrackAuth);

} else {
  document.addEventListener(
    'securetrack:authorized',
    event => start(event.detail),
    { once: true }
  );
}

})();
