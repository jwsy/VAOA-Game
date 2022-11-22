import kaboom from "kaboom"
import { Howl } from "howler"

k = kaboom({
  "fullscreen": true, "startScene": "main",
  "background": [51, 73, 78],
  touchToMouse: true,
})

// load assets
loadPedit("bubble", "sprites/bubble.pedit")
// loadPedit("avocado", "sprites/avocado.pedit")
loadSprite("avocado", "sprites/vaoa-logo.png")
loadSound("avocado-o", "sounds/avocado-o.mp3")
loadSprite("vaoa-bg-phone", "sprites/vaoa-bg-phone.png")
loadSprite("vaoa-bg-wide", "sprites/vaoa-bg-wide.png")
loadSound('bgm', 'sounds/avocado-o.mp3')

const avocadoOSound = new Howl({
  src: ['sounds/avocado-o.mp3'], html5: true, format: ['mp3'], volume: 0.8
})

const popSound = new Howl({
  src: ['sounds/pop.mp3'], html5: true, format: ['mp3']
})

const j2bgmSound = new Howl({
  src: ['sounds/J2edited.mp3'], html5: true, format: ['mp3'],
  // autoplay: true, loop: true,
})

let startTime = -1
let turbos = 0
const TURBOMAX = 2

scene("game", () => {
  // initialize context
  const PLAYER_SPEED = 200
  let showStats = false

  // j2bgmSound.play()

  layers(["bg", "obj", "ui",], "obj")
  // 873 x 648, 247 x 648
  let dynamicbg = width() / height() > 0.8 ? 'vaoa-bg-wide' : 'vaoa-bg-phone'
  let resizeH = height() / 648
  let resizeW = width() / height() > 1.3 ? width() / 873 : width() / 247
  console.log(height() + "," + width() + "," + dynamicbg + ',' + resizeH * height() + "," + resizeW * width())
  console.log(dynamicbg)

  const bg = add([
    layer("bg"),
    sprite(dynamicbg),
    scale(resizeW, resizeH)
  ])

  // // implement touch
  let el = document.getElementsByTagName("canvas")[0]
  el.addEventListener("touchstart", handleTouchMouseStartMove, false)
  el.addEventListener("touchmove", handleTouchMouseStartMove, false)
  let epochTime = Date.now()
  startTime = Date.now()

  function findPos(obj) {
    let curleft = 0
    let curtop = 0

    if (obj.offsetParent) {
      do {
        curleft += obj.offsetLeft
        curtop += obj.offsetTop
      } while (obj = obj.offsetParent)

      return {
        x: curleft - document.body.scrollLeft,
        y: curtop - document.body.scrollTop
      }
    }
  }

  function handleTouchMouseStartMove(evt) {
    evt.preventDefault()
    let el = document.getElementsByTagName("canvas")[0]
    clientRec = el.getBoundingClientRect()
    x = evt.targetTouches[0].pageX
    y = evt.targetTouches[0].pageY
    // console.log("hTMSM : ", clientRec, x, y)
    let curTime = Date.now()
    if (curTime - epochTime > 100) {
      epochTime = curTime
    }
    handleTTouch(x, y)
  }

  const avocado = add([
    sprite("avocado"),
    pos(width() / 2, height() / 2),
    origin("center"),
    "avocado",
    {
      isOFaced: false,
      lastOFaceTime: time(),
      dir: null,
      stopPoint: pos(width() / 2, height() / 2),
      dScale: .75
    },
    area(),
  ])

  onClick('avocado', () => {
    avocadoOSound.play()
  })
  onTouchStart((id, pos) => {
    console.log(`touched ${pos}, avocado ${avocado.pos}`)
    // console.log(`avocado tx pos ${pos.x - avocado.pos.x}`)
    // console.log(`avocado ty pos ${pos.y - avocado.pos.y}`)
    console.log(`avocado dist pos ${pos.dist(avocado.pos)}`)
    if (pos.dist(avocado.pos) < 150) {
      avocadoOSound.play()
    }
  })

  onUpdate("avocado", (r) => {
    if (r.isOFaced) {
      // r.frame = 1
      // r.scale = vec2(avocado.dScale + Math.sin(2.5 * (time() - r.lastOFaceTime)) * 2.8)
      r.scale = vec2(avocado.dScale + Math.sin(2.5 * (time() - r.lastOFaceTime)) * 1.1)
      // console.log(time() - r.lastOFaceTime)
      let ct = time()
      if (ct - r.lastOFaceTime > 1.3) {
        r.frame = 0
        r.lastOFaceTime = ct
        r.isOFaced = false
      }
    }
    else {
      r.scale = vec2(avocado.dScale + Math.sin(time()) * .1)
    }

    if (avocado.dir
      && avocado.pos.x > 0
      && avocado.pos.x < width()
      && avocado.pos.y > 0
      && avocado.pos.y < height()
      && Math.abs(avocado.pos.x - avocado.dir.pos.x) > 10
      && Math.abs(avocado.pos.y - avocado.dir.pos.y) > 10
    ) {
      let angleDeg = avocado.pos.angle(avocado.dir.pos) + 180
      // console.log("moveAvocadoPos : avocado.pos = " + avocado.pos.x + "," + avocado.pos.y)
      // console.log("moveAvocadoPos : avocado.pos.angle(avocado.dir.pos) = " + angleDeg)
      let movX = Math.cos(angleDeg * Math.PI / 180) * PLAYER_SPEED
      let movY = Math.sin(angleDeg * Math.PI / 180) * PLAYER_SPEED
      avocado.move(movX, movY)
    }
    // else {
    //   avocado.move(0,0)
    // }
  })

  onKeyPress('s', () => {
    console.log('Toggle stats')
    showStats = !showStats
    get('debugText').forEach((e) => { e.hidden = showStats })
  });

  onKeyPress('t', () => {
    if (turbos > TURBOMAX) {
      add([
        pos(width() / 2, height() / 10),
        text("MAXIUMUM\nTURBO\nENGAGED", 32),
        origin("top")
      ]);
    }
    else {
      add([
        pos(width() / 2, height() / 10),
        text("\nTURBO\nENGAGED", 32),
        origin("top")
      ]);
      loop(.5, spawnEnemy);
      turbos++;
    }

  })

  function movePlayerLeft() {
    if (avocado.pos.x > 0) {
      avocado.dir = null;
      avocado.move(-PLAYER_SPEED, 0);
    }
  };

  function movePlayerRight() {
    if (avocado.pos.x < width()) {
      avocado.dir = null;
      avocado.move(PLAYER_SPEED, 0);
    }
  };

  function movePlayerUp() {
    if (avocado.pos.y > 0) {
      avocado.dir = null;
      avocado.move(0, -PLAYER_SPEED);
    }
  };

  function movePlayerDown() {
    if (avocado.pos.y < height()) {
      avocado.dir = null;
      avocado.move(0, PLAYER_SPEED);
    }
  };

  onKeyDown("left", movePlayerLeft);
  onKeyDown("right", movePlayerRight);
  onKeyDown("up", movePlayerUp);
  onKeyDown("down", movePlayerDown);

  function spawnEnemy() {
    let insertPos = pos(rand(10, width() - 10), rand(10, height() - 10));

    let enemySprite = "bubble";

    return add([
      sprite(enemySprite),
      insertPos,
      "enemy",
      enemySprite,
      area()
    ]);
  }

  onUpdate("enemy", (e) => {
    // console.log(e);
    e.scale = vec2(.7 + 0.1 * Math.sin(time()));
  });

  onCollide("avocado", "enemy", (b, e) => {
    // console.log(JSON.stringify(e) );
    if (e.is("rainbowpoop")) {
      score.value += 10;
      shake(12);
    }
    else {
      score.value += 1;
      shake(b.dScale * 3);
    }
    destroy(e);
    addKaboom(e.pos);
    if (b.dScale < 2) {
      b.dScale = b.dScale + 0.1;
    } else if (score.value < 50) {
      score.value += 0;
    } else {
      go("end");
    }
    b.isOFaced = true;
    b.lastOFaceTime = time();
    score.text = score.value;
    popSound.play()
    spawnEnemy();
    spawnEnemy();
    spawnEnemy();
  });

  const score = add([
    pos(12, 12),
    text(0, {
      size: 36,
      font: "sinko",
    }),
    { value: 0 },
  ]);

  // display fps
  const fpsText = add([
    pos(width() * 0.5, 24),
    text("fps", { font: "sinko", size: 24 }),
    ,
    { value: 0, },
    "debugText"
  ]);

  function updateFps() {
    fpsText.value = parseFloat(debug.fps()).toFixed(3);
    fpsText.text = "fps: " + fpsText.value;
  };
  loop(0.5, updateFps);

  const aPosText = add([pos(width() * 0.5, 24 * 2), text("apos: " + JSON.stringify(avocado.pos), {
    font: "sinko"
    , size: 24
  }), { value: 0 }, "debugText"]);

  // display mpos
  const mousePosText = add([pos(width() * 0.5, 24 * 3), text("mpos: no mouse detected", {
    font: "sinko",
    size: 24
  }), { value: 0 }, "debugText"]);

  function updateMousePosText() {
    mp = mousePos();
    // console.log("updateMousePosText.mp: ", JSON.stringify(mp));
    mousePosText.text = "mpos: " + JSON.stringify(mp);
    aPosText.text = "apos: " + JSON.stringify(avocado.pos);
    let curTime = Date.now();
    if (curTime - epochTime > 100) {
      epochTime = curTime
      // spawnBullet(player.pos);
    }
    console.log("updateMousePosText => " + JSON.stringify([mp.x, mp.y]));
    // avocado.moveTo(mp.x, mp.y);
    avocado.dir = pos(mp.x, mp.y);
    avocado.stopPoint = pos(mp.x, mp.y);
  };

  // display tpos
  const touchPosText = add([pos(width() * 0.5, 24 * 4), text("tpos: no touch detected", {
    font: "sinko",
    size: 24
  }), { value: 0 }, "debugText"]);

  function handleTTouch(x, y) {
    touchPosText.text = "tpos: " + JSON.stringify({ "x": Math.ceil(x), "y": Math.ceil(y), });
    aPosText.text = "apos: " + JSON.stringify(avocado.pos);
    console.log("handleTTouch : touchPosText.text", touchPosText.text);
    // console.log("avocado.pos", avocado.pos);
    avocado.dir = pos(x, y);
    avocado.stopPoint = pos(x, y);
  };

  onMouseDown(updateMousePosText);

  get('debugText').forEach((e) => { e.hidden = true; });
  // spawn an enemy every period
  loop(.8, spawnEnemy);
});

scene("main", () => {
  layers(["bg", "obj", "ui",], "obj")

  // 873 x 648, 247 x 648
  let dynamicbg = width() / height() > 0.8 ? 'vaoa-bg-wide' : 'vaoa-bg-phone'
  let resizeH = height() / 648
  let resizeW = width() / height() > 1.3 ? width() / 873 : width() / 247
  console.log(height() + "," + width() + "," + dynamicbg + ',' + resizeH * height() + "," + resizeW * width())
  console.log(dynamicbg)

  const bg = add([
    layer("bg"),
    sprite(dynamicbg),
    scale(resizeW, resizeH)
  ])

  const clickme = add([
    layer("ui"),
    pos(width() / 2, height() / 10),
    text("VAOA Game\nby replit@jwsy \n\ngather 55 leaves\n\nClick me to start", 32),
    origin("top"),
  ]);

  const musics = add([
    pos(width() / 2, height()),
    text("Music @B-Diggs-1\n\"Just Two\"\non Soundcloud", {
      size: 32,
      font: "apl386o"
    }),
    origin("bot"),
    layer("ui"),
    area()
  ]);

  const startGame = () => {
    console.log("main => game")
    // for some strange reason I need to play a sound with Howler ONCE
    // avocadoOSound.play();
    // play('bgm')
    j2bgmSound.play()
    go("game")
  };

  const avocado = add([
    sprite("avocado"),
    pos(width() / 2, height() * 3 / 4),
    origin("center"),
    "avocado",
    scale(1.3),
    {
      isOFaced: false,
      lastOFaceTime: time()
    },
    area(),
  ]);

  onTouchStart((id, pos) => {
    console.log(`touched ${pos}, avocado ${avocado.pos}`);
    // console.log(`avocado tx pos ${pos.x - avocado.pos.x}`);
    // console.log(`avocado ty pos ${pos.y - avocado.pos.y}`);
    console.log(`avocado dist pos ${pos.dist(avocado.pos)}`);
    if (pos.dist(avocado.pos) < 150) {
      startGame();
    }
    // if (pos.dist(musics.pos) < 150) {
    //   console.log('musics from scene start')
    //   window.location.assign('https://soundcloud.com/b-diggs-1/just-two')
    // }
  });

  onKeyDown("space", startGame);
  onClick('avocado', startGame);

});

scene("end", () => {
  layers(["bg", "obj", "ui",], "obj")

  // 873 x 648, 247 x 648
  let dynamicbg = width() / height() > 0.8 ? 'vaoa-bg-wide' : 'vaoa-bg-phone'
  let resizeH = height() / 648
  let resizeW = width() / height() > 1.3 ? width() / 873 : width() / 247
  console.log(height() + "," + width() + "," + dynamicbg + ',' + resizeH * height() + "," + resizeW * width())
  console.log(dynamicbg)

  const bg = add([
    layer("bg"),
    sprite(dynamicbg),
    scale(resizeW, resizeH)
  ])

  let totalTime = Date.now() - startTime;

  const thankyou = add([
    pos(width() / 2, height() / 10),
    text("thank you!\n" + totalTime / 1000 + "s\n55 leaves gathered!\n\nby replit@jwsy\n\nclick me to play again", 32),
    origin("top"),
    layer("ui")
  ]);

  const musics = add([
    pos(width() / 2, height()),
    text("Music @B-Diggs-1\n\"Just Two\"\non Soundcloud", {
      size: 32,
      font: "apl386o"
    }),
    origin("bot"),
    layer("obj"),
    "musics",
    area()
  ]);

  const startGame = () => {
    console.log("end => game");
    // for some strange reason I need to play a sound with Howler ONCE
    avocadoOSound.play();
    go("game");
  };

  const avocado = add([
    sprite("avocado"),
    pos(width() / 2, height() * 2 / 3),
    origin("center"),
    "avocado",
    layer("obj"),
    scale(2),
    {
      isOFaced: false,
      lastOFaceTime: time()
    },
    area()
  ]);

  onTouchStart((id, pos) => {
    console.log(`touched ${pos}, avocado ${avocado.pos}`)
    // console.log(`avocado tx pos ${pos.x - avocado.pos.x}`);
    // console.log(`avocado ty pos ${pos.y - avocado.pos.y}`);
    console.log(`avocado dist pos ${pos.dist(avocado.pos)}`)
    if (pos.dist(avocado.pos) < 250) {
      console.log('startGame from scene end')
      startGame()
    }
    if (pos.dist(musics.pos) < 150) {
      console.log('musics from scene end')
      window.location.assign('https://soundcloud.com/b-diggs-1/just-two')
    }
  });

  onClick("musics", () => {

  })
  onKeyDown("space", startGame)
  onClick('avocado', startGame)

});

go("main")
