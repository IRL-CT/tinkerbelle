const control = document.getElementById('control');
const light = document.getElementById('light');

const socket = io();
const interpolate = d3.interpolateLab;
const eases = Object.fromEntries(Object.entries(d3).filter((a) => a.toString().startsWith('ease')).map(([a, b]) => [a.substring(4), b]))
const audio = new Audio();

audio.loop = true;
let current;
let animateID;
let audioID;
let keys;
window.onload  = () => {
  keys = [...document.querySelectorAll('tinker-button')].reduce((obj, btn) => {
    obj[btn.letter.toLowerCase()] = btn
    return obj;
  }, {})
}

function playSound(soundLink, duration) {
  if (soundLink) {
    if (!audio.paused) {
      audio.pause();
    }
    audio.src = soundLink;
    audio.play();
    setTimeout(() =>  audio.pause() , duration);
  }
  return;
}

const runKey = (key) => {
  const { color: { hex }, duration, easing, sound_only, soundLink } = key
  const ease = eases[easing]
  if (sound_only) {
    playSound(soundLink, duration);
    socket.emit('audio', {soundLink, duration})
    return
  }
  if(soundLink){
    playSound(soundLink, duration);
    socket.emit('audio', {soundLink, duration})
  }

  if (animateID) {
    cancelAnimationFrame(animateID)
  }
  const startTime = performance.now();

  function animate(now) {
    let background = document.body.style.backgroundColor || getComputedStyle(document.body)
      .getPropertyValue('--background-body');
    const timeSinceStart = (now - startTime);

    // l goes from 0 to 1;
    const l = ease(Math.min(timeSinceStart / duration, 1));
    current = interpolate(background, hex)(l)
    document.body.style.backgroundColor = current
    socket.emit('hex', current)
    if (l < 1) {
      animateID = requestAnimationFrame(animate);
    }
  }
  animateID = requestAnimationFrame(animate);
}



document.onkeydown = (event) => {
  if (event.isComposing || event.target.tagName === 'TINKER-BUTTON') {
    return;
  }
  keys[event.key] ? runKey(keys[event.key]) : undefined;
}



socket.on('connect', () => {
  socket.on('hex', (val) => {document.body.style.backgroundColor = val})
  socket.on('audio', (val) => {playSound(val.soundLink, val.duration);})
  socket.on('pauseAudio', (val) => {audio.pause();})
  socket.onAny((event, ...args) => {
    console.log(event, args);
  });
});

// enter controller mode
control.onclick = () => {
  console.log('control')
  // make sure you're not in fullscreen
  if (document.fullscreenElement) {
    document.exitFullscreen()
      .then(() => console.log('exited full screen mode'))
      .catch((err) => console.error(err));
  }
  // make buttons and controls visible
  document.getElementById('user').classList.remove('fadeOut');
  document.getElementById('controlPanel').style.opacity = 0.6;
};

light.onclick = () => {
  // safari requires playing on input before allowing audio
  audio.muted = true;
  audio.play().then(audio.muted = false)

  // in light mode make it full screen and fade buttons
  document.documentElement.requestFullscreen();
  document.getElementById('user').classList.add('fadeOut');
  document.getElementById('controlPanel').style.opacity = 0;
};


