(function () {
  const STORAGE_KEY = 'noteTrainerHighscores';

  function loadHighscores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '[]';
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr;
    } catch (e) {
      console.warn('Failed to parse highscores', e);
      return [];
    }
  }

  function saveHighscores(list) {
    try {
      const trimmed = list.slice().sort((a, b) => b.score - a.score).slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save highscores', e);
    }
  }

  function renderHighscores() {
    const container = document.getElementById('highscoresContainer');
    if (!container) return;
    const list = loadHighscores();
    if (list.length === 0) {
      container.innerHTML = '<p>No highscores yet. Play a game and save your score!</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'highscore-list';
    list.forEach((entry, i) => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.textContent = `${i+1}. ${entry.name}`;
      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '12px';
      const scoreSpan = document.createElement('span');
      scoreSpan.textContent = entry.score;
      const dateSpan = document.createElement('span');
      dateSpan.style.opacity = 0.6;
      dateSpan.style.fontSize = '0.9em';
      dateSpan.textContent = new Date(entry.date).toLocaleString();
      right.appendChild(scoreSpan);
      right.appendChild(dateSpan);
      li.appendChild(left);
      li.appendChild(right);
      ul.appendChild(li);
    });
    container.innerHTML = '';
    container.appendChild(ul);
  }

  function clearHighscores() {
    localStorage.removeItem(STORAGE_KEY);
    renderHighscores();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHighscores();
    const clearBtn = document.getElementById('clearHighscores');
    const backBtn = document.getElementById('backBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('Clear highscores?')) clearHighscores();
    });
    if (backBtn) backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  });

  // expose helpers for the main script (optional)
  window._noteTrainerHighscores = {
    load: loadHighscores,
    save: saveHighscores,
    key: STORAGE_KEY
  };
})();
