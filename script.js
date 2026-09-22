const card = document.getElementById('glass-card');
const flipBtn = document.getElementById('flip-btn');
const toast = document.getElementById('copy-toast');

function playCardFlipAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.14);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.14);
}

if (flipBtn) {
  flipBtn.addEventListener('click', () => {
    playCardFlipAudio();
    card.classList.toggle('flipped');
  });
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 1600);
}

document.querySelectorAll('.copy-trigger').forEach(el => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const val = el.getAttribute('data-copy');
    if (!val) return;

    navigator.clipboard.writeText(val).then(() => {
      showToast(`Copied: ${val}`);
    }).catch(() => {
      showToast('Copied to clipboard');
    });
  });
});

function fetchGitHubData() {
  const ghUser = "ArentComing";

  fetch(`https://api.github.com/users/${ghUser}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById("stat-repos").textContent = data.public_repos || 0;
      document.getElementById("stat-followers").textContent = data.followers || 0;
      document.getElementById("stat-following").textContent = data.following || 0;
    })
    .catch(() => {
      document.getElementById("stat-repos").textContent = "-";
      document.getElementById("stat-followers").textContent = "-";
      document.getElementById("stat-following").textContent = "-";
    });

  fetch(`https://api.github.com/users/${ghUser}/repos?sort=pushed&per_page=1`)
    .then(r => r.json())
    .then(repos => {
      if (repos && repos.length > 0) {
        const repo = repos[0];
        const titleEl = document.getElementById("repo-title");
        titleEl.textContent = repo.name;
        titleEl.href = repo.html_url;

        document.getElementById("repo-stars").textContent = `★ ${repo.stargazers_count}`;
        document.getElementById("repo-forks").textContent = `⑂ ${repo.forks_count}`;

        document.getElementById("peek-lang-name").textContent = repo.language || "Markdown/Text";
        document.getElementById("peek-desc").textContent = repo.description || "No description provided for this repository.";
      }
    })
    .catch(() => {
      document.getElementById("repo-title").textContent = "Slappir Projects";
    });
}

function fetchTelegramChannelFeed() {
  const WORKER_ENDPOINT = "https://githubtel.slappir86.workers.dev";

  fetch(WORKER_ENDPOINT)
    .then(r => r.json())
    .then(data => {
      if (data.members) {
        document.getElementById("tg-subs").textContent = `${data.members} subscribers`;
      }
      if (data.feed) {
        document.getElementById("tg-feed-msg").textContent = data.feed;
      }
    })
    .catch(() => {
      document.getElementById("tg-subs").textContent = "1.2K subscribers";
      document.getElementById("tg-feed-msg").textContent = "Recent channel updates";
    });
}

function initParticleCanvas() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.floor((width * height) / 22000);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.45 + 0.2
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 110)})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(render);
  }

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  initParticleCanvas();
  fetchGitHubData();
  fetchTelegramChannelFeed();
});
