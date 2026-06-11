// MOLLY 20周年「燃燃情绪画室」H5 逻辑脚本

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 核心 DOM 节点获取
  // ==========================================
  const screens = {
    loading: document.getElementById('screen-loading'),
    timeline: document.getElementById('screen-timeline'),
    mood: document.getElementById('screen-mood'),
    game: document.getElementById('screen-game'),
    poster: document.getElementById('screen-poster')
  };

  // Loading Screen Elements
  const loadingBar = document.getElementById('loading-bar');
  const loadingPercentage = document.getElementById('loading-percentage');
  const loadingTip = document.getElementById('loading-tip');

  // Timeline Elements
  const timelineTrack = document.getElementById('timeline-track');
  const timelineCards = document.querySelectorAll('.timeline-card');
  const sliderDots = document.getElementById('slider-dots').children;
  const btnGotoMood = document.getElementById('btn-goto-mood');

  // Mood Elements
  const moodItems = document.querySelectorAll('.mood-item');
  const btnGotoGame = document.getElementById('btn-goto-game');

  // Game Elements
  const gameTitle = document.getElementById('game-title');
  const canvasUnderlay = document.getElementById('canvas-underlay');
  const scratchCanvas = document.getElementById('scratch-canvas');
  const particlesCanvas = document.getElementById('particles-canvas');
  const swipeInstruction = document.getElementById('swipe-instruction');
  const burnProgressVal = document.getElementById('burn-progress-val');
  const btnSkipGame = document.getElementById('btn-skip-game');
  const btnGotoPoster = document.getElementById('btn-goto-poster');

  // Poster Elements
  const posterMainImg = document.getElementById('poster-main-img');
  const posterSlogan = document.getElementById('poster-slogan');
  const posterSubtext = document.getElementById('poster-subtext');
  const posterBurnLevel = document.getElementById('poster-burn-level');
  const btnRestart = document.getElementById('btn-restart');
  const btnBuyLink = document.getElementById('btn-buy-link');

  // WeChat Popup Elements
  const wechatPopupOverlay = document.getElementById('wechat-popup-overlay');
  const popupClose = document.getElementById('popup-close');

  // 状态变量
  let currentMoodIndex = 0;
  let hasScratched = false;
  let gameCompleted = false;
  let selectedGameImg = '';

  // ==========================================
  // 1. 资源预加载模块
  // ==========================================
  const imagesToLoad = [
    'LOGO/POPMART logo.png',
    'LOGO/MOLLY logo.png'
  ];

  let loadedCount = 0;
  const totalResources = imagesToLoad.length;

  function preloadAssets() {
    let fakeProgress = 0;
    const interval = setInterval(() => {
      // 真实加载与模拟进度结合，保证加载页动效自然
      const realProgress = (loadedCount / totalResources) * 100;
      if (fakeProgress < realProgress) {
        fakeProgress += 2;
      } else if (fakeProgress < 99) {
        fakeProgress += 0.5;
      }

      const displayProgress = Math.min(Math.round(fakeProgress), 100);
      loadingBar.style.width = `${displayProgress}%`;
      loadingPercentage.textContent = `${displayProgress}%`;

      if (displayProgress >= 100 && loadedCount >= totalResources) {
        clearInterval(interval);
        setTimeout(() => {
          transitionToScreen('timeline');
        }, 600);
      }
    }, 30);

    imagesToLoad.forEach(src => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
      };
      img.onerror = () => {
        console.warn(`Failed to load: ${src}`);
        loadedCount++; // 即使失败也继续，避免死锁
      };
      img.src = src;
    });
  }

  // 开始预加载
  preloadAssets();

  // 页面切换助手
  function transitionToScreen(targetScreenName) {
    Object.keys(screens).forEach(name => {
      if (name === targetScreenName) {
        screens[name].classList.add('active');
        // 特殊屏幕进入时的触发逻辑
        if (targetScreenName === 'game') {
          initScratchGame();
        }
      } else {
        screens[name].classList.remove('active');
      }
    });
  }

  // ==========================================
  // 2. TIMELINE 滑动模块 (双向滑屏手势)
  // ==========================================
  let currentCardIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  // 初始化时间轴圆点
  function updateTimelineDots() {
    Array.from(sliderDots).forEach((dot, idx) => {
      if (idx === currentCardIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function slideTimeline(direction) {
    const totalCards = timelineCards.length;
    if (direction === 'left' && currentCardIndex < totalCards - 1) {
      currentCardIndex++;
    } else if (direction === 'right' && currentCardIndex > 0) {
      currentCardIndex--;
    }

    // 计算位移: 卡片宽度 + margin-right
    const cardWidth = 260;
    const cardMargin = 25;
    const offset = currentCardIndex * (cardWidth + cardMargin);

    // 居中计算修正 (在 320px ~ 480px 宽度容器中)
    const containerWidth = document.getElementById('timeline-slider-container').clientWidth;
    const centerCorrection = (containerWidth - cardWidth) / 2 - 40; // 40 为左侧 padding

    timelineTrack.style.transform = `translateX(${-offset + centerCorrection}px)`;

    // 更新卡片激活类
    timelineCards.forEach((card, idx) => {
      if (idx === currentCardIndex) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    updateTimelineDots();
  }

  // 绑定时间轴手势
  const sliderOuter = document.getElementById('timeline-slider-container');
  sliderOuter.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  sliderOuter.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) { // 划动阈值 40px
      if (diff > 0) {
        slideTimeline('left');
      } else {
        slideTimeline('right');
      }
    }
  }, { passive: true });

  // 绑定 Timeline 页面的按钮事件
  btnGotoMood.addEventListener('click', () => {
    transitionToScreen('mood');
  });

  // ==========================================
  // 3. MOOD 选择空间模块
  // ==========================================
  moodItems.forEach(item => {
    item.addEventListener('click', () => {
      // 移除原有的 selected
      moodItems.forEach(i => i.classList.remove('selected'));
      // 选中当前
      item.classList.add('selected');
      // 提取索引与对应的图片
      currentMoodIndex = parseInt(item.getAttribute('data-mood'));
    });
  });

  btnGotoGame.addEventListener('click', () => {
    transitionToScreen('game');
  });

  // ==========================================
  // 4. CANVAS 刮刮乐涂鸦解压小游戏
  // ==========================================
  let scratchCtx = null;
  let particlesCtx = null;
  let isDrawing = false;
  let particles = [];
  let scratchRafId = null;

  // 情绪与配置文案的映射关系
  const moodConfigs = [
    {
      title: "释放你的创意燃动力",
      img: "Angry Molly白底图/01.png",
      slogan: "燃烧吧！创意！",
      subtext: "打破思维的重重封锁，点燃沉睡的灵感火苗。Angry Molly用炽热的生命力，让奇思妙想尽情释放！"
    },
    {
      title: "卸下你的社交伪装",
      img: "Angry Molly白底图/02.png",
      slogan: "做自己！最燃！",
      subtext: "卸下迎合客套的累赘，勇敢展现最真实的情感。Angry Molly以热烈而坚定的生命热忱，守护你的真诚灵魂。"
    },
    {
      title: "打破繁杂规则束缚",
      img: "Angry Molly白底图/03.png",
      slogan: "打破它！规则！",
      subtext: "拒绝被条条框框束缚，释放渴望自由的小叛逆。Angry Molly带你点燃内心的不屈烈火，冲破一切限制。"
    },
    {
      title: "照亮失焦的前进路口",
      img: "Angry Molly白底图/04.png",
      slogan: "向前冲！探索！",
      subtext: "别在喧嚣的十字路口退缩，宇宙星海任你遨游。Angry Molly以无比的勇气与好奇心，陪你闯荡未知的前路。"
    },
    {
      title: "收纳治愈你的所有委屈",
      img: "Angry Molly白底图/05.png",
      slogan: "抱抱你！童真！",
      subtext: "给紧绷的成人世界放个假，倾听你心底那个小孩。Angry Molly用最温暖纯净的怒火，燃尽你受的所有委屈。"
    }
  ];

  function initScratchGame() {
    // 渲染对应配置
    const config = moodConfigs[currentMoodIndex];
    gameTitle.textContent = config.title;

    // 随机选择一个已知泡泡玛特 IP 形象 (经典小画家 + 5款 Angry Molly + 30款新增盲盒图)
    const knownIPImages = [
      '泡泡玛特添加素材“经典小画家Molly”.jpg',
      'Angry Molly白底图/01.png',
      'Angry Molly白底图/02.png',
      'Angry Molly白底图/03.png',
      'Angry Molly白底图/04.png',
      'Angry Molly白底图/05.png',
      '微信图片_20260610163917_132_3.jpg',
      '微信图片_20260610163918_133_3.jpg',
      '微信图片_20260610163918_134_3.jpg',
      '微信图片_20260610163919_135_3.jpg',
      '微信图片_20260610163920_136_3.jpg',
      '微信图片_20260610163921_137_3.jpg',
      '微信图片_20260610163923_138_3.jpg',
      '微信图片_20260610163925_139_3.jpg',
      '微信图片_20260610163926_140_3.jpg',
      '微信图片_20260610163928_141_3.jpg',
      '微信图片_20260610163930_142_3.jpg',
      '微信图片_20260610163931_143_3.jpg',
      // '微信图片_20260610163933_144_3.jpg',
      // '微信图片_20260610163934_145_3.jpg',
      // '微信图片_20260610163936_146_3.jpg',
      // '微信图片_20260610163937_147_3.jpg',
      // '微信图片_20260610163939_148_3.jpg',
      // '微信图片_20260610163940_149_3.jpg',
      // '微信图片_20260610163941_150_3.jpg',
      // '微信图片_20260610163942_151_3.jpg',
      // '微信图片_20260610163943_152_3.jpg',
      // '微信图片_20260610163945_153_3.jpg',
      // '微信图片_20260610163946_154_3.jpg',
      // '微信图片_20260610163947_155_3.jpg',
      // '微信图片_20260610163948_156_3.jpg',
      // '微信图片_20260610163949_157_3.jpg',
      // '微信图片_20260610163949_158_3.jpg',
      // '微信图片_20260610163950_159_3.jpg',
      // '微信图片_20260610163951_160_3.jpg',
      // '微信图片_20260610163952_161_3.jpg'
    ];
    selectedGameImg = knownIPImages[Math.floor(Math.random() * knownIPImages.length)];
    canvasUnderlay.src = selectedGameImg;

    // 重置进度和按钮
    gameCompleted = false;
    hasScratched = false;
    swipeInstruction.style.opacity = '1';
    burnProgressVal.textContent = '0%';
    btnGotoPoster.style.opacity = '0.5';
    btnGotoPoster.style.pointerEvents = 'none';

    // 适配 Canvas 尺寸
    const rect = scratchCanvas.parentNode.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // 涂鸦蒙层 Canvas
    scratchCanvas.width = rect.width * dpr;
    scratchCanvas.height = rect.height * dpr;
    scratchCanvas.style.width = `${rect.width}px`;
    scratchCanvas.style.height = `${rect.height}px`;

    scratchCtx = scratchCanvas.getContext('2d');
    scratchCtx.scale(dpr, dpr);

    // 火花粒子 Canvas
    particlesCanvas.width = rect.width * dpr;
    particlesCanvas.height = rect.height * dpr;
    particlesCanvas.style.width = `${rect.width}px`;
    particlesCanvas.style.height = `${rect.height}px`;

    particlesCtx = particlesCanvas.getContext('2d');
    particlesCtx.scale(dpr, dpr);

    // 绘制蒙层背景 (潮流暗灰渐变)
    const gradient = scratchCtx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#2c253d');
    gradient.addColorStop(0.5, '#1e1929');
    gradient.addColorStop(1, '#0e0b14');
    scratchCtx.fillStyle = gradient;
    scratchCtx.fillRect(0, 0, rect.width, rect.height);

    // 在蒙层上绘制噪点与科技网格增加质感
    scratchCtx.strokeStyle = 'rgba(255, 62, 108, 0.05)';
    scratchCtx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 20) {
      scratchCtx.beginPath();
      scratchCtx.moveTo(x, 0);
      scratchCtx.lineTo(x, rect.height);
      scratchCtx.stroke();
    }
    for (let y = 0; y < rect.height; y += 20) {
      scratchCtx.beginPath();
      scratchCtx.moveTo(0, y);
      scratchCtx.lineTo(rect.width, y);
      scratchCtx.stroke();
    }

    // 绘制艺术字 "EMO BURNING LAYER" 作为暗纹
    scratchCtx.font = "italic bold 16px system-ui, -apple-system, sans-serif";
    scratchCtx.fillStyle = "rgba(255, 255, 255, 0.04)";
    scratchCtx.textAlign = "center";
    scratchCtx.fillText("SHED YOUR EMOTIONS HERE", rect.width / 2, rect.height / 2 - 20);
    scratchCtx.fillText("FINGER DRAW TO REVEAL MOLLY", rect.width / 2, rect.height / 2 + 10);

    // 初始化粒子动画循环
    particles = [];
    if (scratchRafId) cancelAnimationFrame(scratchRafId);
    particleLoop();

    // 绑定交互事件
    setupCanvasEvents(rect);
  }

  // 粒子动画系统
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      // 随机喷射方向
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1; // 向上飘动微倾向
      // 粒子生命周期
      this.life = 1.0;
      this.decay = Math.random() * 0.03 + 0.02;
      this.size = Math.random() * 5 + 3;

      // 炽热色彩体系：粉红、橙、黄
      const colors = ['#ff3e6c', '#ff7b00', '#ffeb3b', '#7a22ff'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      if (this.size > 0.1) this.size -= 0.1;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.shadowBlur = this.size * 2;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function particleLoop() {
    const rect = particlesCanvas.getBoundingClientRect();
    particlesCtx.clearRect(0, 0, rect.width, rect.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      if (p.life <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw(particlesCtx);
      }
    }
    scratchRafId = requestAnimationFrame(particleLoop);
  }

  function spawnParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      particles.push(new Particle(x, y));
    }
  }

  // 绑定 Canvas 事件监听
  function setupCanvasEvents(rect) {
    let lastX = 0;
    let lastY = 0;

    const startDraw = (clientX, clientY) => {
      isDrawing = true;
      if (!hasScratched) {
        hasScratched = true;
        swipeInstruction.style.opacity = '0';
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      lastX = x;
      lastY = y;

      eraseCircle(x, y);
      spawnParticles(x, y);
    };

    const drawMove = (clientX, clientY) => {
      if (!isDrawing) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // 刮除线条连接，防漏空
      scratchCtx.save();
      scratchCtx.globalCompositeOperation = 'destination-out';
      scratchCtx.lineJoin = 'round';
      scratchCtx.lineCap = 'round';
      scratchCtx.lineWidth = 36; // 笔刷粗细
      scratchCtx.beginPath();
      scratchCtx.moveTo(lastX, lastY);
      scratchCtx.lineTo(x, y);
      scratchCtx.stroke();
      scratchCtx.restore();

      lastX = x;
      lastY = y;

      spawnParticles(x, y);

      // 每移动几步统计一次刮开率以节省性能
      if (Math.random() < 0.15) {
        checkErasePercentage(rect);
      }
    };

    const stopDraw = () => {
      if (isDrawing) {
        isDrawing = false;
        checkErasePercentage(rect);
      }
    };

    // 鼠标事件
    scratchCanvas.addEventListener('mousedown', (e) => {
      startDraw(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      drawMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', stopDraw);

    // 移动端 Touch 事件
    scratchCanvas.addEventListener('touchstart', (e) => {
      // 阻止滚动穿透
      e.preventDefault();
      const t = e.touches[0];
      startDraw(t.clientX, t.clientY);
    }, { passive: false });

    scratchCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      drawMove(t.clientX, t.clientY);
    }, { passive: false });

    scratchCanvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      stopDraw();
    }, { passive: false });
  }

  function eraseCircle(x, y) {
    scratchCtx.save();
    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchCtx.beginPath();
    scratchCtx.arc(x, y, 18, 0, Math.PI * 2);
    scratchCtx.fill();
    scratchCtx.restore();
  }

  // 刮开面积计算（采样计算法）
  function checkErasePercentage(rect) {
    if (gameCompleted) return;

    const dpr = window.devicePixelRatio || 1;
    const w = rect.width * dpr;
    const h = rect.height * dpr;

    // 获取像素信息进行判断
    try {
      const imgData = scratchCtx.getImageData(0, 0, rect.width * dpr, rect.height * dpr);
      const data = imgData.data;
      let totalPixels = 0;
      let erasedPixels = 0;

      // 每 25 个像素采样一次，大幅降低运算负担
      const step = 25 * 4;
      for (let i = 0; i < data.length; i += step) {
        totalPixels++;
        // 透明度接近于 0 (表示已被刮开)
        if (data[i + 3] < 128) {
          erasedPixels++;
        }
      }

      const percent = Math.round((erasedPixels / totalPixels) * 100);
      burnProgressVal.textContent = `${percent}%`;

      // 达到 75% 算通关
      if (percent >= 75) {
        completeScratchGame();
      }
    } catch (e) {
      console.warn("Canvas cross-origin pixels check restriction: ", e);
    }
  }

  function completeScratchGame() {
    gameCompleted = true;
    burnProgressVal.textContent = '100%';

    // 渐变消除整个蒙板 Canvas
    scratchCanvas.style.transition = 'opacity 0.6s ease';
    scratchCanvas.style.opacity = '0';

    // 激活海报生成按钮
    btnGotoPoster.style.opacity = '1';
    btnGotoPoster.style.pointerEvents = 'auto';
    btnGotoPoster.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 跳过或点击跳过按钮
  btnSkipGame.addEventListener('click', () => {
    completeScratchGame();
  });

  // 确认进入海报
  btnGotoPoster.addEventListener('click', () => {
    // 停止粒子绘制 Raf
    if (scratchRafId) cancelAnimationFrame(scratchRafId);
    setupPosterScreen();
    transitionToScreen('poster');
  });

  // ==========================================
  // 5. POSTER 海报结果渲染与跳转
  // ==========================================
  function setupPosterScreen() {
    const config = moodConfigs[currentMoodIndex];
    posterMainImg.src = selectedGameImg;

    if (selectedGameImg === '泡泡玛特添加素材“经典小画家Molly”.jpg') {
      posterSlogan.textContent = "执笔追梦，初心不忘！";
      posterSubtext.textContent = "用画笔绘出心中的斑斓王国，以倔强与坚定突破现实的难关。经典小画家 MOLLY 守护你心底那个无拘无束、快乐创作的小孩。";
    } else if (selectedGameImg.startsWith('微信图片_')) {
      const specialSlogans = [
        "抽中限定款！燃力守护者降临！",
        "喜提隐藏款！快乐因子爆表！",
        "好运连连！抽中你的治愈伙伴！",
        "盲盒欧气加满！真我色彩绽放！"
      ];
      const specialSubtexts = [
        "恭喜你在情绪画室中成功抽出你的限定守护伙伴！愿这份奇妙的好运，点燃你对生活的无限热忱与真诚热爱。",
        "在快节奏的日常里，总有一个心动角色在默默陪伴着你。恭喜抽中隐藏伙伴，让童心与治愈驱散所有压力吧！",
        "每一份期待，都是与美好相遇的伏笔。你的专属限定伙伴已就位，点击下方即刻前往抽盒机开启更多心动旅程！",
        "恭喜抽中20周年限定画作角色！愿你无论身处什么年纪，都保留一份孩童般的纯真与好奇心，勇敢前行。"
      ];

      const randIdx = Math.floor(Math.random() * specialSlogans.length);
      posterSlogan.textContent = specialSlogans[randIdx];
      posterSubtext.textContent = specialSubtexts[randIdx];
    } else {
      posterSlogan.textContent = config.slogan;
      posterSubtext.textContent = config.subtext;
    }

    // 随机一个完美的燃力指数
    const randomBurn = Math.floor(Math.random() * 6) + 95; // 95 - 100 之间随机
    posterBurnLevel.textContent = `燃力指数: ${randomBurn}%`;
  }

  // 重玩一次
  btnRestart.addEventListener('click', () => {
    // 允许重新刮
    scratchCanvas.style.opacity = '1';
    scratchCanvas.style.transition = 'none';
    transitionToScreen('mood');
  });

  // 微信购买跳转弹窗逻辑
  btnBuyLink.addEventListener('click', () => {
    wechatPopupOverlay.classList.add('active');
  });

  popupClose.addEventListener('click', () => {
    wechatPopupOverlay.classList.remove('active');
  });

  // 页面空白处关闭弹框
  wechatPopupOverlay.addEventListener('click', (e) => {
    if (e.target === wechatPopupOverlay) {
      wechatPopupOverlay.classList.remove('active');
    }
  });

  // ==========================================
  // Timeline 视差过渡微调与自动滚屏初始化
  // ==========================================
  // 计算时间轴卡片的初始布局位置
  setTimeout(() => {
    slideTimeline('none');
  }, 100);
});
