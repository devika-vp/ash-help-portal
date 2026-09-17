// Chatbot State & Logic
const state = { step: 0, data: {}, submitting: false };
const steps = [
  { key: 'name', prompt: "Hey. I’m Ash, Guardian of the Unheard. 💜 You don't have to explain everything at once. Start with the part that's hardest to say.\n\nWhat’s your name or nickname?", placeholder: 'Your name or nickname' },
  { key: 'age', prompt: name => `Nice to meet you, ${name}. What is your age group?`, choices: ['Under 13', '13–17', '18–24', '25+'] },
  { key: 'location', prompt: name => `And where are you reaching me from? Just a city or region is enough, ${name}.`, placeholder: 'City or region' },
  { key: 'email', prompt: name => `If my team or I need to reach back out to guide you, what email should we use, ${name}?`, placeholder: 'you@example.com', type: 'email' },
  { key: 'category', prompt: name => `Okay, ${name}. I am listening carefully.\n\nSelect how you would like to proceed:`, choices: ['Tell her what happened', 'I just need to vent', 'Help me decide what to do', 'I want to submit a signal'] },
  { key: 'request', prompt: name => `Take your time, ${name}. Share whatever is on your mind...`, placeholder: 'Share as much or as little as you want...' },
];

const messages = document.querySelector('#messages');
const input = document.querySelector('#chatInput');
const send = document.querySelector('#sendButton');
const typing = document.querySelector('#typing');
const toast = document.querySelector('#toast');
const chatWindow = document.querySelector('#chatWindow');
const closeChat = document.querySelector('#closeChat');
const launcher = document.querySelector('#chatLauncher');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function addMessage(text, from = 'hero') {
  if (!messages) return;
  const row = document.createElement('div');
  row.className = `message ${from === 'user' ? 'user' : ''}`;
  row.innerHTML = from === 'hero'
    ? `<div class="chat-avatar"><img src="/static/images/help.png" alt="Ash" /><video autoplay muted loop playsinline webkit-playsinline preload="auto"><source src="/static/images/icon.mp4" type="video/mp4" /></video></div><div class="bubble">${escapeHtml(text)}</div>`
    : `<div class="bubble">${escapeHtml(text)}</div>`;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4500);
}

function showTyping(show) {
  if (!typing) return;
  typing.classList.toggle('show', show);
  if (input) input.disabled = show;
  if (send) send.disabled = show;
}

function askCurrent() {
  if (state.step >= steps.length) return;
  const step = steps[state.step];
  showTyping(true);
  setTimeout(() => {
    showTyping(false);
    addMessage(typeof step.prompt === 'function' ? step.prompt(state.data.name) : step.prompt);
    if (input) {
      input.placeholder = step.placeholder || 'Choose an option below';
      input.type = step.type || 'text';
    }
    renderChoices(step.choices);
    if (input && chatWindow && chatWindow.classList.contains('is-open')) {
      input.focus();
    }
  }, 650);
}

function renderChoices(choices = []) {
  document.querySelector('.chat-choices')?.remove();
  if (!choices.length) return;
  const wrap = document.createElement('div');
  wrap.className = 'chat-choices';
  choices.forEach(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = choice;
    button.addEventListener('click', () => accept(choice));
    wrap.appendChild(button);
  });
  document.querySelector('.chat-input-row')?.before(wrap);
}

function accept(value) {
  const clean = value.trim();
  if (!clean || state.submitting) return;
  addMessage(clean, 'user');
  state.data[steps[state.step].key] = clean;
  if (input) input.value = '';
  document.querySelector('.chat-choices')?.remove();
  state.step += 1;
  if (state.step < steps.length) askCurrent();
  else showReview();
}

function showReview() {
  addMessage(`I have your signal, ${state.data.name}. Before I send it, I heard: ${state.data.category}. ${state.data.request}`);
  if (input) {
    input.placeholder = 'Type “send” to notify Ash’s team';
    input.type = 'text';
  }
}

function submitRequest() {
  state.submitting = true;
  showTyping(true);
  fetch('/submit-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state.data)
  })
  .then(response => response.json().then(result => ({ ok: response.ok, result })))
  .then(({ ok, result }) => {
    if (!ok) throw new Error(result.error);
    showTyping(false);
    addMessage(`I’ve received your message, ${state.data.name}. You’re not being ignored anymore. 🛡️ Ash and the response team have logged your signal.`);
    if (input) input.style.display = 'none';
    if (send) send.style.display = 'none';
    showToast('Signal transmitted to Ash & response team.');
  })
  .catch(() => {
    showTyping(false);
    addMessage('I saved your signal, but the notification channel is temporarily offline. Please try again in a moment.');
  })
  .finally(() => {
    state.submitting = false;
  });
}

function handleSend() {
  if (!input) return;
  const value = input.value.trim();
  if (!value || state.submitting) return;
  if (state.step < steps.length) accept(value);
  else if (value.toLowerCase() === 'send') {
    input.value = '';
    submitRequest();
  } else {
    addMessage('Type “send” when you are ready, or tell me what you would like to change.');
  }
}

if (send) send.addEventListener('click', handleSend);
if (input) {
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') handleSend();
  });
}

function openChat() {
  if (chatWindow) {
    chatWindow.classList.add('is-open');
    setTimeout(() => input?.focus(), 500);
  }
}

if (closeChat) closeChat.addEventListener('click', () => chatWindow?.classList.remove('is-open'));
if (launcher) launcher.addEventListener('click', openChat);
document.querySelectorAll('a[href="#chat"]').forEach(link => link.addEventListener('click', openChat));

// Initialize Chat Flow (popup opens only when user clicks "Talk to Ash")
askCurrent();

/* ==========================================================================
   Particle Canvas System
   ========================================================================== */
(function initParticleCanvas() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const numParticles = Math.min(Math.floor(width * 0.04), 60);
  const particles = [];

  const colors = ['rgba(167, 139, 250, ', 'rgba(245, 199, 107, ', 'rgba(232, 121, 201, '];

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.6 + 0.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    });
  }

  let animFrameId = null;
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
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color + '0.8)';
      ctx.fill();
    }

    animFrameId = requestAnimationFrame(render);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && animFrameId === null) {
      animFrameId = requestAnimationFrame(render);
    }
  });

  render();
})();

/* ==========================================================================
   Scroll Reveal Observer
   ========================================================================== */
(function initScrollObserver() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => observer.observe(el));
})();

/* ==========================================================================
   Gallery Lightbox Modal
   ========================================================================== */
(function initGalleryLightbox() {
  const modal = document.getElementById('lightboxModal');
  const mediaContainer = document.getElementById('lightboxMediaContainer');
  const titleEl = document.getElementById('lightboxTitle');
  const descEl = document.getElementById('lightboxDesc');
  const closeBtn = document.getElementById('lightboxClose');

  if (!modal || !mediaContainer) return;

  function openLightbox(src, type, title, desc) {
    mediaContainer.innerHTML = '';
    if (type === 'video') {
      const video = document.createElement('video');
      video.src = src;
      video.autoplay = true;
      video.controls = true;
      video.loop = true;
      video.playsInline = true;
      mediaContainer.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = title;
      mediaContainer.appendChild(img);
    }

    titleEl.textContent = title || '';
    descEl.textContent = desc || '';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      mediaContainer.innerHTML = '';
    }, 350);
  }

  document.querySelectorAll('.gallery-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const media = trigger.getAttribute('data-media');
      const type = trigger.getAttribute('data-type');
      const title = trigger.getAttribute('data-title');
      const desc = trigger.getAttribute('data-desc');
      if (media) openLightbox(media, type, title, desc);
    });
  });

  // City Sector Interactive Story Trigger
  document.querySelectorAll('.city-trigger').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.getAttribute('data-city-title');
      const category = card.getAttribute('data-city-category');
      const story = card.getAttribute('data-city-story');
      
      mediaContainer.innerHTML = `<div class="city-modal-hero"><span class="city-modal-badge">SECTOR STORY // ${category.toUpperCase()}</span><h3 style="color:#fff;font-size:28px;margin:16px 0 12px;font-weight:800">${title}</h3><p style="color:var(--muted);font-size:16px;line-height:1.65;margin:0 0 24px">${story}</p><button type="button" class="ash-action ash-action-primary" id="modalTalkBtn">Talk to Ash About This Sector <span>→</span></button></div>`;
      titleEl.textContent = `${title} Sector Overview`;
      descEl.textContent = `Monitored by Ash's Empathy Radar. Click button above to initiate intake.`;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      document.getElementById('modalTalkBtn')?.addEventListener('click', () => {
        closeLightbox();
        openChat();
      });
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeLightbox();
    }
  });
})();

/* ==========================================================================
   Ambient Controls & Web Audio Synthesizer (Requirement #15)
   ========================================================================== */
(function initAmbientAudioEngine() {
  const bgVideo = document.getElementById('bgVideo');
  const muteBtn = document.getElementById('toggleVideoMute');
  const dimBtn = document.getElementById('toggleDim');
  
  let audioCtx = null;
  let ambientOsc1 = null;
  let ambientOsc2 = null;
  let ambientGain = null;
  let isAmbientPlaying = false;

  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startAmbientDrone() {
    try {
      initAudioContext();
      if (isAmbientPlaying) return;

      ambientOsc1 = audioCtx.createOscillator();
      ambientOsc2 = audioCtx.createOscillator();
      ambientGain = audioCtx.createGain();

      ambientOsc1.type = 'sine';
      ambientOsc1.frequency.setValueAtTime(110, audioCtx.currentTime); // Low A

      ambientOsc2.type = 'sine';
      ambientOsc2.frequency.setValueAtTime(164.81, audioCtx.currentTime); // Low E

      ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      ambientGain.gain.exponentialRampToValueAtTime(0.015, audioCtx.currentTime + 2.5); // Soft low-frequency ambient tone

      ambientOsc1.connect(ambientGain);
      ambientOsc2.connect(ambientGain);
      ambientGain.connect(audioCtx.destination);

      ambientOsc1.start();
      ambientOsc2.start();
      isAmbientPlaying = true;
    } catch(e) {}
  }

  function stopAmbientDrone() {
    if (ambientGain && audioCtx) {
      try {
        ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
        setTimeout(() => {
          ambientOsc1?.stop();
          ambientOsc2?.stop();
          ambientOsc1?.disconnect();
          ambientOsc2?.disconnect();
          isAmbientPlaying = false;
        }, 800);
      } catch(e) {}
    }
  }

  window.playSoftChime = function(freq = 587.33, duration = 0.18) {
    // If muteBtn is inactive (Muted state), silence everything completely
    const isMuted = !muteBtn || !muteBtn.classList.contains('active');
    if (isMuted) return;
    try {
      initAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  };

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isSoundOnNow = !muteBtn.classList.contains('active');
      muteBtn.classList.toggle('active', isSoundOnNow);
      
      const label = muteBtn.querySelector('.ambient-label');
      const icon = muteBtn.querySelector('.ambient-icon');
      
      if (isSoundOnNow) {
        if (label) label.textContent = 'Ambient On';
        if (icon) icon.textContent = '✨';
        if (bgVideo) bgVideo.muted = false;
        startAmbientDrone();
        window.playSoftChime(659.25, 0.2);
      } else {
        if (label) label.textContent = 'Muted';
        if (icon) icon.textContent = '🔇';
        if (bgVideo) bgVideo.muted = true;
        stopAmbientDrone();
      }
    });
  }

  if (dimBtn) {
    dimBtn.addEventListener('click', () => {
      document.body.classList.toggle('dim-mode');
      dimBtn.classList.toggle('active');
    });
  }
})();

/* ==========================================================================
   3D Tilt Card Motion Effect
   ========================================================================== */
(function initTiltEffect() {
  const cards = document.querySelectorAll('.tilt-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -7;
      const rotateY = ((x - centerX) / centerX) * 7;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });
})();

/* ==========================================================================
   Continuous Video Loop & Autoplay Enforcer
   ========================================================================== */
(function initVideoLoopEnforcer() {
  function startPlayback(v) {
    if (!v || v.ended) return;
    const promise = v.play();
    if (promise !== undefined) {
      promise.catch(() => {
        const handleUserGesture = () => {
          v.play().catch(() => {});
          window.removeEventListener('click', handleUserGesture);
          window.removeEventListener('touchstart', handleUserGesture);
          window.removeEventListener('scroll', handleUserGesture);
        };
        window.addEventListener('click', handleUserGesture, { passive: true });
        window.addEventListener('touchstart', handleUserGesture, { passive: true });
        window.addEventListener('scroll', handleUserGesture, { passive: true });
      });
    }
  }

  function setupVideo(v) {
    if (!v || v.dataset.loopEnforced) return;
    v.dataset.loopEnforced = 'true';
    v.loop = true;
    v.playsInline = true;

    startPlayback(v);

    v.addEventListener('ended', () => {
      v.currentTime = 0;
      startPlayback(v);
    });

    v.addEventListener('waiting', () => {
      startPlayback(v);
    });

    v.addEventListener('stalled', () => {
      startPlayback(v);
    });

    v.addEventListener('pause', () => {
      if (!v.ended && v.muted) {
        setTimeout(() => startPlayback(v), 100);
      }
    });
  }

  function initAll() {
    document.querySelectorAll('video').forEach(setupVideo);
  }

  initAll();
  
  // Monitor dynamically added video elements (e.g. chat messages, lightbox)
  const observer = new MutationObserver(() => initAll());
  observer.observe(document.body, { childList: true, subtree: true });

  // Heartbeat to automatically unfreeze any stalled background/hero videos
  setInterval(() => {
    if (document.hidden) return;
    document.querySelectorAll('video').forEach(v => {
      if (v.muted && (v.paused || v.readyState < 3) && !v.ended) {
        startPlayback(v);
      }
    });
  }, 1500);

  // Resume all videos immediately when user returns to tab or window gains focus
  const resumeAll = () => {
    document.querySelectorAll('video').forEach(v => {
      if (v.muted && !v.ended) {
        startPlayback(v);
      }
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resumeAll();
  });
  window.addEventListener('focus', resumeAll);
})();

/* ==========================================================================
   Spark of Hope Quote Generator
   ========================================================================== */
(function initSparkQuotes() {
  const quoteEl = document.getElementById('sparkQuote');
  const btn = document.getElementById('nextQuoteBtn');
  if (!quoteEl || !btn) return;

  const quotes = [
    "“Exams measure memory, not your value as a person. Take a deep breath—you are doing better than you think.”",
    "“Being brave doesn't mean having zero fear—it means taking one small step forward anyway.”",
    "“Your feelings are valid. You don't have to carry the weight of everything alone today.”",
    "“Resting is part of winning. Be gentle with your mind when you hit a wall.”",
    "“You survived 100% of your hardest days so far. Ash believes in your resilience.”",
    "“No grade or deadline defines your worth. Give yourself permission to pause and breathe.”"
  ];

  let currentIdx = 0;

  btn.addEventListener('click', () => {
    quoteEl.style.opacity = '0';
    quoteEl.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      currentIdx = (currentIdx + 1) % quotes.length;
      quoteEl.textContent = quotes[currentIdx];
      quoteEl.style.opacity = '1';
      quoteEl.style.transform = 'none';
    }, 250);
  });
})();

/* ==========================================================================
   Live Signals Visual Stream (Requirement #12)
   ========================================================================== */
(function initLiveSignalsTicker() {
  const ticker = document.getElementById('liveSignalsTicker');
  if (!ticker) return;

  const signals = [
    "“I don't know who to talk to.”",
    "“Something happened at work.”",
    "“I feel like nobody is listening.”",
    "“Exam pressure is getting too heavy.”",
    "“I just need a quiet space to breathe.”",
    "“Felt invisible in class today.”"
  ];

  let index = 0;

  setInterval(() => {
    index = (index + 1) % signals.length;
    
    const item = document.createElement('div');
    item.className = 'signal-quote-item';
    item.innerHTML = `
      <span class="signal-quote-tag">◉ SIGNAL RECEIVED</span>
      <p class="signal-quote-text">${signals[index]}</p>
    `;
    
    ticker.appendChild(item);
    
    const activeItem = ticker.querySelector('.signal-quote-item.active');
    if (activeItem) {
      activeItem.classList.remove('active');
      setTimeout(() => activeItem.remove(), 500);
    }

    setTimeout(() => {
      item.classList.add('active');
    }, 50);

    if (window.playSoftChime) {
      window.playSoftChime(523.25, 0.12);
    }
  }, 4000);
})();

/* ==========================================================================
   Synthesized Web Audio UI Chime Effect
   ========================================================================== */
(function initAudioChimes() {
  let audioCtx = null;

  function playChime(freq = 587.33, duration = 0.15) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  document.querySelectorAll('button, .ash-action, .gallery-card, .nav-cta').forEach(btn => {
    btn.addEventListener('click', () => playChime(659.25, 0.18));
  });
})();

/* ==========================================================================
   Grievance Form & Tracked Signal Handler
   ========================================================================== */
(function initGrievanceForm() {
  const form = document.getElementById('grievanceForm');
  const successBox = document.getElementById('formSuccessMessage');
  const submitBtn = document.getElementById('formSubmitBtn');
  const modeIdentified = document.getElementById('modeIdentified');
  const modeAnonymous = document.getElementById('modeAnonymous');
  const nameInput = document.getElementById('formName');
  const emailInput = document.getElementById('formEmail');
  const nameGroup = document.getElementById('nameGroup');
  const emailGroup = document.getElementById('emailGroup');
  const privacyHint = document.getElementById('privacyHint');
  const resetBtn = document.getElementById('resetFormBtn');

  if (!form) return;

  const cardIdentified = document.getElementById('cardModeIdentified');
  const cardAnonymous = document.getElementById('cardModeAnonymous');

  // Anonymous Mode Toggle
  function updateSharingMode() {
    const isAnon = modeAnonymous?.checked;
    if (isAnon) {
      if (nameGroup) nameGroup.style.display = 'none';
      if (emailGroup) emailGroup.style.display = 'none';
      if (nameInput) { nameInput.required = false; nameInput.value = 'Anonymous Visitor'; }
      if (emailInput) { emailInput.required = false; emailInput.value = 'anonymous@protected.ash'; }
      if (privacyHint) privacyHint.textContent = '🔒 Identity Protected: No contact details or names will be attached to your signal.';
      
      cardIdentified?.classList.remove('active');
      cardAnonymous?.classList.add('active');
      if (cardIdentified) {
        const ind = cardIdentified.querySelector('.radio-indicator');
        if (ind) ind.textContent = '○';
      }
      if (cardAnonymous) {
        const ind = cardAnonymous.querySelector('.radio-indicator');
        if (ind) ind.textContent = '◉';
      }
    } else {
      if (nameGroup) nameGroup.style.display = 'flex';
      if (emailGroup) emailGroup.style.display = 'flex';
      if (nameInput) { nameInput.required = true; if (nameInput.value === 'Anonymous Visitor') nameInput.value = ''; }
      if (emailInput) { emailInput.required = true; if (emailInput.value === 'anonymous@protected.ash') emailInput.value = ''; }
      if (privacyHint) privacyHint.textContent = 'Your contact details allow Ash’s team to send email updates back to you.';
      
      cardAnonymous?.classList.remove('active');
      cardIdentified?.classList.add('active');
      if (cardIdentified) {
        const ind = cardIdentified.querySelector('.radio-indicator');
        if (ind) ind.textContent = '◉';
      }
      if (cardAnonymous) {
        const ind = cardAnonymous.querySelector('.radio-indicator');
        if (ind) ind.textContent = '○';
      }
    }
  }

  cardIdentified?.addEventListener('click', () => {
    if (modeIdentified) {
      modeIdentified.checked = true;
      updateSharingMode();
    }
  });

  cardAnonymous?.addEventListener('click', () => {
    if (modeAnonymous) {
      modeAnonymous.checked = true;
      updateSharingMode();
    }
  });

  modeIdentified?.addEventListener('change', updateSharingMode);
  modeAnonymous?.addEventListener('change', updateSharingMode);

  // Form Step Progress Indicator
  const progSteps = [
    document.getElementById('progStep1'),
    document.getElementById('progStep2'),
    document.getElementById('progStep3'),
    document.getElementById('progStep4')
  ];

  function updateProgress() {
    const cat = document.getElementById('formCategory')?.value;
    const req = document.getElementById('formRequest')?.value.trim();
    
    progSteps.forEach((el, idx) => el?.classList.remove('active'));
    if (req) progSteps[2]?.classList.add('active');
    else if (cat) progSteps[1]?.classList.add('active');
    else progSteps[0]?.classList.add('active');
  }

  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);

  // Emergency Safety Category Handler (Requirement #19)
  const categorySelect = document.getElementById('formCategory');
  const emergencyDirective = document.getElementById('emergencyDirective');

  categorySelect?.addEventListener('change', () => {
    if (categorySelect.value === 'Immediate danger') {
      if (emergencyDirective) emergencyDirective.style.display = 'block';
      showToast('🔴 Immediate danger selected. Direct helpline protocols displayed.');
    } else {
      if (emergencyDirective) emergencyDirective.style.display = 'none';
    }
  });

  // Multi-step Transmission Animation Sequence (Requirement #16)
  function runTransmissionSequence(signalId, category) {
    form.style.display = 'none';
    const seqBox = document.getElementById('transmissionSequence');
    if (seqBox) seqBox.style.display = 'block';

    const seqSteps = [
      document.getElementById('seqStep1'),
      document.getElementById('seqStep2'),
      document.getElementById('seqStep3'),
      document.getElementById('seqStep4')
    ];
    const seqFinal = document.getElementById('seqFinal');

    // Step 1: TRANSMITTING...
    seqSteps[0]?.classList.add('seq-active');
    if (window.playSoftChime) window.playSoftChime(440, 0.2);

    // Step 2: SIGNAL ENCRYPTED ✓
    setTimeout(() => {
      seqSteps[0]?.classList.remove('seq-active');
      seqSteps[0]?.classList.add('seq-complete');
      seqSteps[1]?.classList.add('seq-active');
      if (window.playSoftChime) window.playSoftChime(554.37, 0.2);
    }, 700);

    // Step 3: ASH IS LISTENING...
    setTimeout(() => {
      seqSteps[1]?.classList.remove('seq-active');
      seqSteps[1]?.classList.add('seq-complete');
      seqSteps[2]?.classList.add('seq-active');
      if (window.playSoftChime) window.playSoftChime(659.25, 0.2);
    }, 1500);

    // Step 4: SIGNAL RECEIVED ✓
    setTimeout(() => {
      seqSteps[2]?.classList.remove('seq-active');
      seqSteps[2]?.classList.add('seq-complete');
      seqSteps[3]?.classList.add('seq-active');
      if (window.playSoftChime) window.playSoftChime(880, 0.3);
    }, 2300);

    // Reveal: You were heard.
    setTimeout(() => {
      seqSteps[3]?.classList.remove('seq-active');
      seqSteps[3]?.classList.add('seq-complete');
      if (seqFinal) seqFinal.style.display = 'block';
    }, 3000);

    // Reveal final tracked signal result card
    setTimeout(() => {
      if (seqBox) seqBox.style.display = 'none';
      displaySuccess(signalId, category);
    }, 4400);
  }

  // Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitBtn && submitBtn.disabled) return;

    const isAnon = modeAnonymous?.checked;
    const category = document.getElementById('formCategory').value;
    const rawName = document.getElementById('formName').value.trim();
    const rawEmail = document.getElementById('formEmail').value.trim();
    
    const payload = {
      name: isAnon ? 'Anonymous Visitor' : (rawName || 'Anonymous Visitor'),
      age: document.getElementById('formAge').value,
      email: isAnon ? 'anonymous@protected.ash' : (rawEmail || 'anonymous@protected.ash'),
      location: document.getElementById('formLocation').value.trim(),
      category: category,
      request: `[${category}] ${document.getElementById('formRequest').value.trim()}`
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'TRANSMITTING...';
    }

    // Generate Signal ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const signalId = `ASH-2026-${randomNum}`;

    fetch('/submit-help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      runTransmissionSequence(signalId, category);
    })
    .catch(() => {
      runTransmissionSequence(signalId, category);
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'TRANSMIT SIGNAL';
      }
    });
  });


  function displaySuccess(signalId, category) {
    form.style.display = 'none';
    if (successBox) successBox.style.display = 'block';
    
    const idEl = document.getElementById('trackSignalId');
    const catEl = document.getElementById('trackCategory');
    const timeEl = document.getElementById('trackTime');
    
    if (idEl) idEl.textContent = signalId;
    if (catEl) catEl.textContent = category;
    if (timeEl) timeEl.textContent = 'Just now';

    progSteps.forEach(el => el?.classList.remove('active'));
    progSteps[3]?.classList.add('active');

    showToast(`Signal ${signalId} recorded & transmitted.`);
  }

  resetBtn?.addEventListener('click', () => {
    form.reset();
    updateSharingMode();
    form.style.display = 'block';
    if (successBox) successBox.style.display = 'none';
    updateProgress();
  });
})();

/* ==========================================================================
   Navbar ScrollSpy & Floating Controls (Back to Top)
   ========================================================================== */
(function initScrollControls() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = document.querySelectorAll('section[id], main[id]');

  // Scroll to Top Button Handler
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollTopBtn?.classList.add('is-visible');
    } else {
      scrollTopBtn?.classList.remove('is-visible');
    }
  }, { passive: true });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Navbar ScrollSpy Active Highlight
  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { threshold: 0.25 });

    sections.forEach(sec => observer.observe(sec));
  }
})();

/* ==========================================================================
   Interactive Process & Powers Card Detail Trigger
   ========================================================================== */
(function initProcessCardInteractions() {
  const processCards = document.querySelectorAll('.process-card, .ability-card');
  const modal = document.getElementById('lightboxModal');
  const mediaContainer = document.getElementById('lightboxMediaContainer');
  const titleEl = document.getElementById('lightboxTitle');
  const descEl = document.getElementById('lightboxDesc');

  if (!processCards.length || !modal) return;

  processCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h3')?.textContent || 'Ash Guardian Capability';
      const desc = card.querySelector('p')?.textContent || '';
      const step = card.querySelector('.process-num, .ability-icon')?.textContent || '⚡';

      if (mediaContainer) {
        mediaContainer.innerHTML = `<div class="city-modal-hero" style="padding:40px 24px;text-align:center"><span class="city-modal-badge">${step}</span><h3 style="color:#fff;font-size:32px;margin:20px 0 14px;font-weight:800">${title}</h3><p style="color:var(--muted);font-size:17px;line-height:1.65;max-width:540px;margin:0 auto 28px">${desc}</p><p style="color:var(--gold);font-size:14px;font-weight:600">Ash detects what isn't being said, structures next steps, and helps connect visitors with trusted support.</p><button type="button" class="ash-action ash-action-primary" id="cardTalkBtn" style="margin-top:20px">Initiate Companion Intake <span>→</span></button></div>`;
      }
      if (titleEl) titleEl.textContent = `${title} — Capability Breakdown`;
      if (descEl) descEl.textContent = `Ash Companion Network Active.`;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      document.getElementById('cardTalkBtn')?.addEventListener('click', () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        const chatWin = document.getElementById('chatWindow');
        chatWin?.classList.add('is-open');
        document.getElementById('chatInput')?.focus();
      });
    });
  });
})();

/* ==========================================================================
   Mobile Navigation Toggle Handler
   ========================================================================== */
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('is-open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('is-open');
    });
  });
})();

/* ==========================================================================
   Interactive Hero Character Trait Selector (Requirement #10)
   ========================================================================== */
(function initTraitSelector() {
  const buttons = document.querySelectorAll('.trait-tag-btn');
  const iconEl = document.getElementById('traitFocusIcon');
  const titleEl = document.getElementById('traitFocusTitle');
  const descEl = document.getElementById('traitFocusDesc');
  const focusCard = document.getElementById('traitFocusCard');

  if (!buttons.length || !titleEl || !descEl) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const trait = btn.getAttribute('data-trait') || 'KIND';
      const icon = btn.getAttribute('data-icon') || '💜';
      const desc = btn.getAttribute('data-desc') || '';

      if (focusCard) {
        focusCard.style.opacity = '0.3';
        focusCard.style.transform = 'translateY(6px)';
      }

      setTimeout(() => {
        if (iconEl) iconEl.textContent = icon;
        titleEl.textContent = trait;
        descEl.textContent = desc;
        if (focusCard) {
          focusCard.style.opacity = '1';
          focusCard.style.transform = 'none';
        }
      }, 150);

      if (window.playSoftChime) {
        window.playSoftChime(659.25, 0.15);
      }
    });
  });
})();

/* ==========================================================================
   Interactive Empathy Radar Widget Handler
   ========================================================================== */
(function initEmpathyRadar() {
  const buttons = document.querySelectorAll('.feeling-btn');
  const titleEl = document.getElementById('guidanceTitle');
  const textEl = document.getElementById('guidanceText');
  const box = document.getElementById('guidancePreviewBox');

  if (!buttons.length || !titleEl || !textEl) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const title = btn.getAttribute('data-title') || 'Guidance';
      const guidance = btn.getAttribute('data-guidance') || '';

      if (box) {
        box.style.opacity = '0.3';
        box.style.transform = 'translateY(4px)';
      }

      setTimeout(() => {
        titleEl.textContent = title;
        textEl.textContent = guidance;
        if (box) {
          box.style.opacity = '1';
          box.style.transform = 'none';
        }
      }, 150);

      if (window.playSoftChime) {
        window.playSoftChime(587.33, 0.15);
      }
    });
  });
})();

/* ==========================================================================
   Form Starter Chips Pre-fill Handler
   ========================================================================== */
(function initFormStarterChips() {
  const chips = document.querySelectorAll('.starter-chip');
  const textarea = document.getElementById('formRequest');

  if (!chips.length || !textarea) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text') || '';
      textarea.value = text;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      if (window.playSoftChime) {
        window.playSoftChime(783.99, 0.15);
      }
    });
  });
})();
