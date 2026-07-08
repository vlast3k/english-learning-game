const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576;
const ASSET_VERSION = "20260708-touch-word-reveal";
const UI_FONT = "\"Merienda\", \"Trebuchet MS\", \"Georgia\", serif";
const ADVENTURE_FONT = "\"Merienda\", \"Trebuchet MS\", \"Georgia\", serif";
const WORD_REVEAL_HOLD_MS = 1000;
const REVEAL_TRANSLATIONS = new Map([
  ["a", "един"],
  ["alex", "Алекс"],
  ["am", "съм"],
  ["an", "един"],
  ["and", "и"],
  ["are", "са"],
  ["backpack", "раница"],
  ["backpackes", "раници"],
  ["backpacks", "раници"],
  ["bakpack", "раница"],
  ["best", "най-добро"],
  ["camp", "лагер"],
  ["challenge", "изпитание"],
  ["checking", "проверява"],
  ["checks", "проверява"],
  ["choose", "избери"],
  ["correct", "правилно"],
  ["find", "намери"],
  ["first", "първо"],
  ["for", "за"],
  ["found", "намери"],
  ["gear", "екипировка"],
  ["get", "вземи"],
  ["ground", "земя"],
  ["guide", "водач"],
  ["hand", "ръка"],
  ["in", "в"],
  ["is", "е"],
  ["jungle", "джунгла"],
  ["looking", "гледат"],
  ["map", "карта"],
  ["mapp", "карта"],
  ["mep", "карта"],
  ["now", "сега"],
  ["on", "на"],
  ["path", "пътека"],
  ["pick", "избери"],
  ["plural", "множествено"],
  ["question", "въпрос"],
  ["raises", "вдига"],
  ["right", "точно"],
  ["roap", "въже"],
  ["rop", "въже"],
  ["rope", "въже"],
  ["sentence", "изречение"],
  ["spelling", "правопис"],
  ["the", "the"],
  ["then", "после"],
  ["this", "този"],
  ["talk", "говори"],
  ["to", "към"],
  ["tool", "инструмент"],
  ["two", "две"],
  ["what", "какво"],
  ["where", "къде"],
  ["which", "кое"],
  ["with", "с"],
  ["use", "използвай"],
  ["walk", "върви"],
  ["word", "дума"],
  ["boiling", "ври"],
  ["burning", "гори"],
  ["campfire", "огън"],
  ["cauldron", "казан"],
  ["crackling", "пука"],
  ["dinner", "вечеря"],
  ["explorers", "изследователи"],
  ["glowing", "свети"],
  ["hangs", "виси"],
  ["hanging", "виси"],
  ["inside", "вътре"],
  ["keeps", "пази"],
  ["lantern", "фенер"],
  ["lights", "осветява"],
  ["long", "дълъг"],
  ["lying", "лежи"],
  ["night", "нощ"],
  ["over", "над"],
  ["ready", "готов"],
  ["safe", "безопасни"],
  ["sleeping", "спи"],
  ["slowly", "бавно"],
  ["soup", "супа"],
  ["strong", "здраво"],
  ["supplies", "провизии"],
  ["tent", "палатка"],
  ["tonight", "тази нощ"],
  ["trail", "пътека"],
  ["warm", "топъл"],
  ["water", "вода"],
]);

class CampScene extends Phaser.Scene {
  constructor() {
    super("CampScene");
    this.learnedWords = [];
    this.flags = {};
    this.activeBubble = null;
    this.commandText = null;
    this.inventoryText = null;
    this.inventoryItems = null;
    this.inventoryTooltip = null;
    this.assistantButton = null;
    this.heroTween = null;
    this.validatedItemTranslations = new Set();
    this.validatedSceneIntroTranslations = new Set();
  }

  preload() {
    const versionedAsset = (path) => `${path}?v=${ASSET_VERSION}`;
    this.load.image("campBg", versionedAsset("assets/phaser/camp-bg-painted.png"));
    this.load.spritesheet("heroSprite", versionedAsset("assets/phaser/hero-painted-spritesheet.png"), { frameWidth: 192, frameHeight: 220 });
    this.load.spritesheet("heroPortraits", versionedAsset("assets/phaser/hero-painted-portraits.png"), { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("guideSprite", versionedAsset("assets/phaser/guide-painted-spritesheet.png"), { frameWidth: 192, frameHeight: 220 });
    this.load.json("scenario", versionedAsset("scenarios/sun-temple-poc.json"));
  }

  create() {
    this.scenario = this.cache.json.get("scenario");
    this.camp = this.scenario.scenes.camp;
    this.guideTree = this.scenario.dialogues.guide_intro_tree;
    this.objectQuizzes = this.createObjectQuizzes();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "campBg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 44, GAME_WIDTH, 88, 0x1f2d24, 0.16);
    this.createCharacterAnimations();
    this.setupNavigation();

    this.createHotspots();
    this.guide = this.createGuide(602, 440);
    this.hero = this.createHero(360, 470);
    this.createHud();

    this.input.on("pointerdown", (pointer, targets) => {
      if (targets.length > 0 || this.activeBubble) {
        return;
      }
      if (pointer.y >= 360) {
        this.setCommand("Walk to clearing");
        this.walkHeroTo(pointer.x, pointer.y);
      }
    });
    this.input.on("pointermove", (pointer) => this.resetRevealIfPointerLeft(pointer));
    this.input.on("pointerup", (pointer) => this.endActiveWordReveal(pointer));
    this.input.on("pointerupoutside", (pointer) => this.endActiveWordReveal(pointer));
    this.time.delayedCall(280, () => this.openLevelIntro());
  }

  createCharacterAnimations() {
    if (!this.anims.exists("hero-walk-down")) {
      this.anims.create({
        key: "hero-walk-down",
        frames: this.anims.generateFrameNumbers("heroSprite", { start: 16, end: 23 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: "hero-walk-up",
        frames: this.anims.generateFrameNumbers("heroSprite", { start: 16, end: 23 }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: "hero-walk-side",
        frames: this.anims.generateFrameNumbers("heroSprite", { start: 16, end: 23 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists("guide-idle")) {
      this.anims.create({
        key: "guide-idle",
        frames: this.anims.generateFrameNumbers("guideSprite", { start: 0, end: 0 }),
        frameRate: 1,
        repeat: -1,
      });
      this.anims.create({
        key: "guide-talk",
        frames: this.anims.generateFrameNumbers("guideSprite", { start: 4, end: 7 }),
        frameRate: 7,
        repeat: -1,
      });
      this.anims.create({
        key: "guide-point",
        frames: this.anims.generateFrameNumbers("guideSprite", { start: 8, end: 11 }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  createHud() {
    const hudBg = this.add.graphics().setDepth(900);
    hudBg.fillStyle(0x0b1d18, 0.22);
    hudBg.fillRoundedRect(22, 20, 190, 96, 10);
    hudBg.fillStyle(0xfffbef, 0.9);
    hudBg.lineStyle(2, 0x173837, 0.18);
    hudBg.fillRoundedRect(18, 16, 190, 96, 10);
    hudBg.strokeRoundedRect(18, 16, 190, 96, 10);
    hudBg.fillStyle(0x174846, 0.96);
    hudBg.fillRoundedRect(30, 26, 142, 28, 7);
    hudBg.fillStyle(0xf0b74f, 1);
    hudBg.fillRoundedRect(30, 26, 8, 28, 4);
    hudBg.lineStyle(1, 0xfff2cf, 0.42);
    hudBg.strokeRoundedRect(43, 31, 120, 17, 5);
    hudBg.fillStyle(0x8d5b2f, 0.78);
    hudBg.fillRoundedRect(34, 68, 154, 32, 8);
    hudBg.fillStyle(0xffe4a3, 0.3);
    hudBg.fillRoundedRect(39, 72, 144, 22, 7);

    this.add.text(51, 30, "FIELD KIT", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      fontStyle: "700",
      color: "#fff4cf",
    }).setDepth(901);

    this.inventoryText = this.add.text(41, 72, "Empty", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "700",
      color: "#fff4cf",
    }).setDepth(901);
    this.inventoryItems = this.add.container(56, 84).setDepth(902);

    this.statusText = this.add.text(GAME_WIDTH - 32, 24, "Prepare for the jungle", {
      fontFamily: UI_FONT,
      fontSize: "17px",
      fontStyle: "700",
      color: "#173837",
      backgroundColor: "rgba(255,251,239,0.92)",
      padding: { x: 12, y: 8 },
    }).setOrigin(1, 0).setDepth(901);

    this.commandBg = this.add.graphics().setDepth(900);
    this.commandBg.fillStyle(0x1f2d24, 0.82);
    this.commandBg.fillRoundedRect(322, 522, 380, 40, 8);
    this.commandText = this.add.text(512, 542, "Walk to...", {
      fontFamily: ADVENTURE_FONT,
      fontSize: "17px",
      fontStyle: "700",
      color: "#fff6d4",
    }).setOrigin(0.5).setDepth(901);

    this.createAssistantButton();
  }

  createAssistantButton() {
    const x = GAME_WIDTH - 52;
    const y = 98;
    const button = this.add.container(x, y).setDepth(905).setSize(48, 48);
    const bg = this.add.graphics();
    const icon = this.add.text(0, -1, "?", {
      fontFamily: ADVENTURE_FONT,
      fontSize: "28px",
      fontStyle: "700",
      color: "#fff4cf",
    }).setOrigin(0.5);
    const hitPlate = this.add.zone(0, 0, 54, 54).setInteractive({ useHandCursor: true });
    const redraw = (state = "idle") => {
      const hover = state === "hover";
      const down = state === "down";
      bg.clear();
      bg.fillStyle(0x0b1d18, down ? 0.34 : 0.24);
      bg.fillCircle(3, 4, 24);
      bg.fillStyle(down ? 0x0f6a68 : hover ? 0x178f86 : 0x174846, 0.98);
      bg.lineStyle(3, hover || down ? 0xf0b74f : 0xfff2cf, hover || down ? 1 : 0.78);
      bg.fillCircle(0, 0, 23);
      bg.strokeCircle(0, 0, 23);
      bg.lineStyle(1, 0xfff2cf, hover ? 0.65 : 0.36);
      bg.strokeCircle(0, 0, 15);
    };
    redraw();
    hitPlate.on("pointerover", () => {
      redraw("hover");
      this.setCommand("Ask helper");
    });
    hitPlate.on("pointerout", () => redraw("idle"));
    hitPlate.on("pointerdown", () => {
      redraw("down");
      this.openAssistantBubble();
    });
    hitPlate.on("pointerup", () => redraw("hover"));
    button.add([bg, icon, hitPlate]);
    this.assistantButton = button;
  }

  openAssistantBubble() {
    const hint = this.getAssistantHint();
    this.showSpeechBubble({
      speaker: hint.speaker || this.contentModel?.assistant?.speaker || "Helper",
      text: hint.text,
      bg: hint.bg,
      anchor: hint.anchor || { x: GAME_WIDTH - 84, y: 156 },
      onClose: () => this.closeBubble(),
      options: [{ text: "OK", action: () => this.closeBubble() }],
    });
    if (this.activeBubble) {
      this.activeBubble.assistantHint = hint;
    }
  }

  getAssistantHint() {
    const missingGear = ["rope", "backpack", "map"].filter((word) => !this.learnedWords.includes(word));
    if (missingGear.length > 0) {
      return {
        text: `Get the ${missingGear.join(", ")} first.`,
        bg: `Първо вземи: ${missingGear.join(", ")}.`,
      };
    }
    if (!this.flags.jungle_path_open) {
      return {
        text: "Talk to the guide.",
        bg: "Говори с водача.",
      };
    }
    return {
      text: "Use the jungle path.",
      bg: "Използвай пътеката към джунглата.",
    };
  }

  createHotspots() {
    this.hotspots = [
      {
        id: "rope",
        label: "rope",
        english: "rope",
        bg: "въже",
        x: 222,
        y: 424,
        walkTo: { x: 258, y: 464 },
        radius: 28,
        intro: {
          text: "A long rope is lying on the ground. It looks strong.",
          bg: "Дълго въже лежи на земята. Изглежда здраво.",
          translation_check: {
            prompt: "Choose the Bulgarian translation before you pick it up.",
            validating_text: "Validating...",
            options: [
              { text: "Дълго въже лежи на земята. Изглежда здраво.", isCorrect: true },
              { text: "Къса пръчка лежи до огъня. Изглежда топла." },
              { text: "Дълга карта виси над масата. Изглежда стара." },
            ],
          },
        },
      },
      {
        id: "backpack",
        label: "backpack",
        english: "backpack",
        bg: "раница",
        x: 128,
        y: 444,
        walkTo: { x: 170, y: 468 },
        radius: 31,
        intro: {
          text: "A backpack is ready for the trail. It keeps supplies safe.",
          bg: "Раницата е готова за пътеката. Тя пази провизиите.",
          translation_check: {
            prompt: "Choose the Bulgarian translation before you pick it up.",
            validating_text: "Validating...",
            options: [
              { text: "Раницата е готова за пътеката. Тя пази провизиите.", isCorrect: true },
              { text: "Картата е готова за масата. Тя пази огъня." },
              { text: "Въжето е готово за сън. То свети през нощта." },
            ],
          },
        },
      },
      {
        id: "map",
        label: "map",
        english: "map",
        bg: "карта",
        x: 526,
        y: 386,
        walkTo: { x: 516, y: 456 },
        radius: 48,
        intro: {
          text: "A map is hanging over the table. Alex is looking at it now.",
          bg: "Карта виси над масата. Алекс я гледа сега.",
          translation_check: {
            prompt: "Choose the Bulgarian translation before you pick it up.",
            validating_text: "Validating...",
            options: [
              { text: "Карта виси над масата. Алекс я гледа сега.", isCorrect: true },
              { text: "Раница лежи на земята. Алекс я носи сега." },
              { text: "Казан виси над огъня. Водата ври бавно." },
            ],
          },
        },
      },
      {
        id: "cauldron",
        label: "cauldron",
        english: "cauldron",
        bg: "казан",
        x: 698,
        y: 392,
        walkTo: { x: 630, y: 468 },
        radius: 26,
        scenery: true,
        description: { text: "A cauldron hangs over the fire. The water is boiling slowly.", bg: "Казан виси над огъня. Водата ври бавно." },
      },
      {
        id: "campfire",
        label: "campfire",
        english: "campfire",
        bg: "огън",
        x: 700,
        y: 452,
        walkTo: { x: 630, y: 480 },
        radius: 28,
        scenery: true,
        description: { text: "The campfire is burning. It keeps the camp warm tonight.", bg: "Лагерният огън гори. Той пази лагера топъл тази нощ." },
      },
      {
        id: "lantern",
        label: "lantern",
        english: "lantern",
        bg: "фенер",
        x: 148,
        y: 298,
        walkTo: { x: 180, y: 448 },
        radius: 20,
        scenery: true,
        description: { text: "A lantern is glowing on the table. It lights the camp at night.", bg: "Фенер свети на масата. Той осветява лагера през нощта." },
      },
      {
        id: "tent",
        label: "tent",
        english: "tent",
        bg: "палатка",
        x: 210,
        y: 250,
        walkTo: { x: 220, y: 448 },
        radius: 50,
        scenery: true,
        description: { text: "The tent is ready for sleeping. The explorers are resting inside tonight.", bg: "Палатката е готова за спане. Изследователите почиват вътре тази нощ." },
      },
    ];

    this.hotspots.forEach((hotspot) => {
      const marker = this.add.container(hotspot.x, hotspot.y).setDepth(530).setSize(hotspot.radius * 2, hotspot.radius * 2);
      const glow = this.add.graphics();
      const label = this.add.text(0, hotspot.radius + 13, hotspot.label, {
        fontFamily: ADVENTURE_FONT,
        fontSize: "14px",
        fontStyle: "700",
        color: "#173837",
        backgroundColor: "rgba(255,251,239,0.93)",
        padding: { x: 7, y: 4 },
      }).setOrigin(0.5).setAlpha(0);

      marker.add([glow, label]);
      hotspot.glow = glow;
      this.drawHotspotGlow(hotspot, false);
      const zone = this.add.zone(hotspot.x, hotspot.y, hotspot.radius * 2.4, hotspot.radius * 2.4)
        .setDepth(850)
        .setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => label.setAlpha(1));
      zone.on("pointerout", () => label.setAlpha(0));
      zone.on("pointerdown", () => {
        this.closeBubble();
        this.setCommand(`Look at ${hotspot.label}`);
        if (hotspot.scenery) {
          this.walkHeroTo(hotspot.walkTo.x, hotspot.walkTo.y, () => this.openSceneryBubble(hotspot));
        } else {
          this.walkHeroTo(hotspot.walkTo.x, hotspot.walkTo.y, () => this.openObjectIntro(hotspot));
        }
      });
      hotspot.marker = marker;
      hotspot.zone = zone;
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.45, to: 1 },
        duration: 950,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.exitMarker = this.createExitMarker(938, 355);
  }

  createExitMarker(x, y) {
    const marker = this.add.container(x, y).setDepth(540).setSize(76, 76);
    const glow = this.add.graphics();
    glow.fillStyle(0xf4c44e, 0.92);
    glow.fillRoundedRect(-18, -18, 36, 36, 8);
    glow.lineStyle(4, 0xfff7d0, 1);
    glow.beginPath();
    glow.moveTo(-6, -10);
    glow.lineTo(8, 0);
    glow.lineTo(-6, 10);
    glow.strokePath();
    const label = this.add.text(0, 42, "jungle path", {
      fontFamily: ADVENTURE_FONT,
      fontSize: "14px",
      fontStyle: "700",
      color: "#173837",
      backgroundColor: "rgba(255,251,239,0.93)",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5);
    marker.add([glow, label]);
    const zone = this.add.zone(x, y, 96, 118)
      .setDepth(850)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      this.closeBubble();
      this.setCommand("Walk to jungle path");
      this.walkHeroTo(895, 435, () => {
        if (!this.flags.jungle_path_open) {
          this.showSpeechBubble({
            speaker: "Alex",
            text: "The guide raises a hand. \"Gear first, then jungle.\"",
            bg: "Водачът вдига ръка: \"Първо екипировката, после джунглата.\"",
            anchor: { x: this.hero.x + 18, y: this.hero.y - 100 },
            options: [{ text: "OK", action: () => this.closeBubble() }],
          });
          return;
        }
        this.setCommand("The jungle path is open!");
        this.statusText.setText("Jungle path open");
        this.flashToast("Next scene would load here.");
      });
    });
    marker.zone = zone;
    return marker;
  }

  createHero(x, y) {
    const hero = this.add.container(x, y).setDepth(y).setSize(72, 124);
    hero.shadowOuter = this.add.ellipse(0, -11, 88, 22, 0x14201a, 0.22);
    hero.shadow = this.add.ellipse(0, -12, 58, 12, 0x14201a, 0.42);
    hero.fireBounce = this.add.ellipse(10, -42, 46, 92, 0xf4b942, 0.12);
    hero.sprite = this.add.sprite(0, 0, "heroSprite", 24).setOrigin(0.5, 1);
    hero.sprite.setTint(0xfff1d2);
    hero.add([hero.shadowOuter, hero.shadow, hero.fireBounce, hero.sprite]);
    hero.facing = "down";
    hero.expression = "normal";
    hero.walkStartedAt = 0;
    hero.setScale(this.getCharacterScale(y));
    return hero;
  }

  createGuide(x, y) {
    const guide = this.add.container(x, y).setDepth(y).setSize(80, 130);
    guide.highlight = this.add.graphics();
    this.drawGuideHighlight(guide.highlight);
    guide.shadowOuter = this.add.ellipse(0, -11, 92, 23, 0x14201a, 0.22);
    guide.shadow = this.add.ellipse(0, -12, 62, 13, 0x14201a, 0.44);
    guide.fireBounce = this.add.ellipse(-8, -44, 52, 96, 0xf4b942, 0.13);
    guide.sprite = this.add.sprite(0, 0, "guideSprite", 0).setOrigin(0.5, 1);
    guide.sprite.setTint(0xfff1d2);
    guide.sprite.play("guide-idle");
    guide.add([guide.highlight, guide.shadowOuter, guide.shadow, guide.fireBounce, guide.sprite]);
    guide.setScale(this.getCharacterScale(y));
    guide.zone = this.add.zone(x, y - 62, 96, 142)
      .setDepth(850)
      .setInteractive({ useHandCursor: true });
    guide.zone.on("pointerdown", () => this.onGuideClicked());
    return guide;
  }

  drawHotspotGlow(hotspot, retrieved) {
    const color = retrieved ? 0x38d276 : 0xffcf5a;
    const fillAlpha = retrieved ? 0.17 : 0.11;
    const lineAlpha = retrieved ? 1 : 0.9;
    hotspot.glow.clear();
    hotspot.glow.lineStyle(3, color, lineAlpha);
    hotspot.glow.strokeCircle(0, 0, hotspot.radius);
    hotspot.glow.fillStyle(color, fillAlpha);
    hotspot.glow.fillCircle(0, 0, hotspot.radius);
    if (retrieved) {
      hotspot.glow.lineStyle(2, 0xfffbef, 0.78);
      hotspot.glow.beginPath();
      hotspot.glow.moveTo(-hotspot.radius * 0.32, -2);
      hotspot.glow.lineTo(-hotspot.radius * 0.08, hotspot.radius * 0.25);
      hotspot.glow.lineTo(hotspot.radius * 0.42, -hotspot.radius * 0.28);
      hotspot.glow.strokePath();
    }
  }

  drawGuideHighlight(graphics) {
    graphics.clear();
    graphics.lineStyle(3, 0x73d7ff, 0.92);
    graphics.strokeCircle(0, -68, 48);
    graphics.fillStyle(0x73d7ff, 0.09);
    graphics.fillCircle(0, -68, 48);
    graphics.lineStyle(1, 0xfffbef, 0.55);
    graphics.strokeCircle(0, -68, 55);
  }

  createObjectQuizzes() {
    return {
      rope: [
        {
          text: "Rope challenge 1/3. Which spelling is correct for this camp tool?",
          bg: "Предизвикателство с въже 1/3. Кое изписване е правилно?",
          options: [
            { text: "rope", isCorrect: true },
            { text: "roap", feedback: "Почти, но oa тук не е правилно. Правилното изписване е rope." },
            { text: "rop", feedback: "Липсва последната буква e. Правилно: rope." },
          ],
        },
        {
          text: "Rope challenge 2/3. The gear tag is almost ready. Which line fits the rope?",
          bg: "Предизвикателство с въже 2/3. Етикетът за екипировката е почти готов. Кой ред пасва на въжето?",
          options: [
            { text: "Alex found a rope.", isCorrect: true },
            { text: "Alex found an rope.", feedback: "Използваме an пред гласен звук. Rope започва със съгласен звук, затова е a rope." },
            { text: "Alex found rope a.", feedback: "В английския статията идва преди съществителното: a rope." },
          ],
        },
        {
          text: "Rope challenge 3/3. Right now, Alex ___ the rope.",
          bg: "Предизвикателство с въже 3/3. Точно сега Алекс ___ въжето.",
          options: [
            { text: "is checking", isCorrect: true },
            { text: "checks", feedback: "Checks е за навик. За действие точно сега използваме is + -ing." },
            { text: "checking", feedback: "Липсва is. Правилно: Alex is checking." },
          ],
        },
      ],
      backpack: [
        {
          text: "Backpack challenge 1/3. Which spelling is correct?",
          bg: "Предизвикателство с раница 1/3. Кое изписване е правилно?",
          options: [
            { text: "backpack", isCorrect: true },
            { text: "bakpack", feedback: "Липсва c след ba. Правилно: backpack." },
            { text: "backpak", feedback: "Липсва c в края. Правилно: backpack." },
          ],
        },
        {
          text: "Backpack challenge 2/3. Pick the correct plural.",
          bg: "Предизвикателство с раница 2/3. Избери правилното множествено число.",
          options: [
            { text: "two backpacks", isCorrect: true },
            { text: "two backpack", feedback: "След two трябва множествено число: backpacks." },
            { text: "two backpackes", feedback: "За backpack добавяме само -s: backpacks." },
          ],
        },
        {
          text: "Backpack challenge 3/3. The camp report needs the backpack location.",
          bg: "Предизвикателство с раница 3/3. Докладът от лагера има нужда от мястото на раницата.",
          options: [
            { text: "The backpack is on the ground.", isCorrect: true },
            { text: "The backpack are on the ground.", feedback: "Backpack е единствено число, затова използваме is." },
            { text: "The backpack on the ground.", feedback: "Липсва глаголът is." },
          ],
        },
      ],
      map: [
        {
          text: "Map challenge 1/3. Which spelling is correct?",
          bg: "Предизвикателство с карта 1/3. Кое изписване е правилно?",
          options: [
            { text: "map", isCorrect: true },
            { text: "mapp", feedback: "Има само едно p. Правилно: map." },
            { text: "mep", feedback: "Средната буква е a. Правилно: map." },
          ],
        },
        {
          text: "Map challenge 2/3. Choose the correct question.",
          bg: "Предизвикателство с карта 2/3. Избери правилния въпрос.",
          options: [
            { text: "Where is the map?", isCorrect: true },
            { text: "Where the map is?", feedback: "Въпросът има ред: Where + is + subject." },
            { text: "Where are the map?", feedback: "Map е единствено число, затова е is." },
          ],
        },
        {
          text: "Map challenge 3/3. Alex and the guide ___ looking at the map.",
          bg: "Предизвикателство с карта 3/3. Алекс и водачът ___ гледат картата.",
          options: [
            { text: "are", isCorrect: true },
            { text: "is", feedback: "Alex and the guide са двама, затова използваме are." },
            { text: "am", feedback: "Am се използва само с I." },
          ],
        },
      ],
    };
  }

  onGuideClicked() {
    this.closeBubble();
    this.setCommand("Talk to guide");
    this.walkHeroTo(610, 470, () => {
      this.faceHeroToward(this.guide.x, this.guide.y, "normal");
      this.playGuideTalk();
      if (!["rope", "backpack", "map"].every((word) => this.learnedWords.includes(word))) {
        this.showSpeechBubble({
          speaker: "Guide",
          text: "Find the camp gear first: backpack, rope, and map.",
          bg: "Първо намери екипировката в лагера: раница, въже и карта.",
          anchor: { x: this.guide.x, y: this.guide.y - 128 },
          options: [{ text: "OK", action: () => this.closeBubble() }],
        });
        return;
      }
      this.openGuideQuestion("node_1");
    });
  }

  walkHeroTo(x, y, onComplete = null) {
    if (this.heroTween) {
      this.heroTween.stop();
    }
    this.closeToast();
    // Route around obstacles (table, campfire) instead of walking straight through.
    const goal = this.clampToWalkable(x, y);
    const path = this.findPath({ x: this.hero.x, y: this.hero.y }, goal);
    // path[0] is the current position; walk through the remaining waypoints.
    this.walkToken = (this.walkToken || 0) + 1;
    this.hero.strideAccumDist = 0;
    this.hero.strideAccumTime = 0;
    this.followHeroPath(path.slice(1), this.walkToken, onComplete);
  }

  followHeroPath(waypoints, token, onComplete = null) {
    if (token !== this.walkToken) {
      return;
    }
    if (!waypoints.length) {
      const lastDx = this.hero.sprite.flipX ? -1 : 1;
      this.animateHeroWalk(false, lastDx, 0);
      this.hero.setDepth(Math.round(this.hero.y));
      if (onComplete) {
        onComplete();
      }
      return;
    }
    const [target, ...rest] = waypoints;
    const dx = target.x - this.hero.x;
    const dy = target.y - this.hero.y;
    const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, target.x, target.y);
    const duration = Phaser.Math.Clamp(distance * 7.6, 120, 2800);
    this.hero.prevWalkX = this.hero.x;
    this.hero.prevWalkY = this.hero.y;
    this.animateHeroWalk(true, dx, dy);
    this.heroTween = this.tweens.add({
      targets: this.hero,
      x: target.x,
      y: target.y,
      duration,
      ease: rest.length ? "Linear" : "Sine.easeOut",
      onUpdate: () => {
        this.hero.setDepth(Math.round(this.hero.y));
        this.hero.setScale(this.getCharacterScale(this.hero.y));
        this.syncHeroStride();
        this.updateHeroWalkPose(dx, dy);
      },
      onComplete: () => {
        this.hero.setDepth(Math.round(this.hero.y));
        this.followHeroPath(rest, token, onComplete);
      },
    });
  }

  setupNavigation() {
    // Ground area the hero may stand on (feet position), in game coordinates.
    this.walkablePoly = [
      { x: 55, y: 412 },
      { x: 980, y: 412 },
      { x: 1008, y: 566 },
      { x: 24, y: 566 },
    ];
    // Ground footprints the hero must walk around. Values are the base of each
    // prop where it meets the ground (feet cannot enter these boxes).
    this.obstacles = [
      { id: "table", x1: 386, y1: 400, x2: 580, y2: 474 },
      { id: "fire", x1: 624, y1: 398, x2: 740, y2: 484 },
    ];
    // How far path corners are pushed off each obstacle so the hero body clears it.
    this.navClearance = 30;
  }

  pointInPoly(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if ((a.y > p.y) !== (b.y > p.y) &&
        p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
        inside = !inside;
      }
    }
    return inside;
  }

  pointInRect(p, r, margin = 0) {
    return p.x >= r.x1 - margin && p.x <= r.x2 + margin &&
      p.y >= r.y1 - margin && p.y <= r.y2 + margin;
  }

  clampToWalkable(x, y) {
    let p = { x, y };
    // Keep inside the walkable polygon bounds.
    const minX = Math.min(...this.walkablePoly.map((v) => v.x)) + 6;
    const maxX = Math.max(...this.walkablePoly.map((v) => v.x)) - 6;
    const minY = Math.min(...this.walkablePoly.map((v) => v.y)) + 4;
    const maxY = Math.max(...this.walkablePoly.map((v) => v.y)) - 4;
    p.x = Phaser.Math.Clamp(p.x, minX, maxX);
    p.y = Phaser.Math.Clamp(p.y, minY, maxY);
    // Push out of any obstacle to its nearest edge.
    for (const r of this.obstacles) {
      if (this.pointInRect(p, r)) {
        const toLeft = p.x - r.x1;
        const toRight = r.x2 - p.x;
        const toTop = p.y - r.y1;
        const toBottom = r.y2 - p.y;
        const min = Math.min(toLeft, toRight, toTop, toBottom);
        if (min === toBottom) {
          p.y = r.y2 + 8;
        } else if (min === toTop) {
          p.y = r.y1 - 8;
        } else if (min === toLeft) {
          p.x = r.x1 - 8;
        } else {
          p.x = r.x2 + 8;
        }
      }
    }
    return p;
  }

  segIntersectsRect(a, b, r) {
    // Quick accept: either endpoint strictly inside the rect.
    if (this.pointInRect(a, r, -0.5) || this.pointInRect(b, r, -0.5)) {
      return true;
    }
    const edges = [
      [{ x: r.x1, y: r.y1 }, { x: r.x2, y: r.y1 }],
      [{ x: r.x2, y: r.y1 }, { x: r.x2, y: r.y2 }],
      [{ x: r.x2, y: r.y2 }, { x: r.x1, y: r.y2 }],
      [{ x: r.x1, y: r.y2 }, { x: r.x1, y: r.y1 }],
    ];
    return edges.some(([p, q]) => this.segmentsIntersect(a, b, p, q));
  }

  segmentsIntersect(p1, p2, p3, p4) {
    const d = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const d1 = d(p3, p4, p1);
    const d2 = d(p3, p4, p2);
    const d3 = d(p1, p2, p3);
    const d4 = d(p1, p2, p4);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    return false;
  }

  lineIsClear(a, b) {
    return !this.obstacles.some((r) => this.segIntersectsRect(a, b, r));
  }

  findPath(start, goal) {
    // Direct line if nothing is in the way.
    if (this.lineIsClear(start, goal)) {
      return [start, goal];
    }
    // Visibility graph: nodes are start, goal and the expanded corners of each
    // obstacle. Edges connect nodes whose straight line avoids all obstacles.
    const c = this.navClearance;
    const nodes = [start, goal];
    for (const r of this.obstacles) {
      nodes.push(
        { x: r.x1 - c, y: r.y1 - c },
        { x: r.x2 + c, y: r.y1 - c },
        { x: r.x2 + c, y: r.y2 + c },
        { x: r.x1 - c, y: r.y2 + c },
      );
    }
    // Drop corner nodes that fall inside another obstacle.
    const valid = nodes.filter((n, i) =>
      i < 2 || !this.obstacles.some((r) => this.pointInRect(n, r)));
    const n = valid.length;
    const dist = new Array(n).fill(Infinity);
    const prev = new Array(n).fill(-1);
    const done = new Array(n).fill(false);
    dist[0] = 0;
    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      for (let i = 0; i < n; i++) {
        if (!done[i] && (u === -1 || dist[i] < dist[u])) {
          u = i;
        }
      }
      if (u === -1 || dist[u] === Infinity) {
        break;
      }
      done[u] = true;
      if (u === 1) {
        break;
      }
      for (let v = 0; v < n; v++) {
        if (done[v] || !this.lineIsClear(valid[u], valid[v])) {
          continue;
        }
        const w = Phaser.Math.Distance.Between(valid[u].x, valid[u].y, valid[v].x, valid[v].y);
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          prev[v] = u;
        }
      }
    }
    if (dist[1] === Infinity) {
      return [start, goal];
    }
    const path = [];
    for (let at = 1; at !== -1; at = prev[at]) {
      path.unshift(valid[at]);
    }
    return path;
  }

  getCharacterScale(y) {
    return 0.39 + y / 2050;
  }

  animateHeroWalk(isWalking, dx = 0, dy = 0) {
    const facing = this.getFacingFromDelta(dx, dy);
    if (!isWalking) {
      this.setHeroIdle(facing);
      return;
    }
    this.hero.facing = facing;
    this.hero.expression = "normal";
    this.hero.walkStartedAt = this.time.now;
    this.updateHeroWalkPose(dx, dy);
    if (facing === "side") {
      this.hero.sprite.setFlipX(dx < 0);
      this.hero.sprite.play("hero-walk-side", true);
      return;
    }
    this.hero.sprite.setFlipX(dx < 0);
    this.hero.sprite.play(facing === "up" ? "hero-walk-up" : "hero-walk-down", true);
  }

  syncHeroStride() {
    if (!this.hero?.sprite?.anims) {
      return;
    }
    const nowX = this.hero.x;
    const nowY = this.hero.y;
    const moved = Phaser.Math.Distance.Between(this.hero.prevWalkX ?? nowX, this.hero.prevWalkY ?? nowY, nowX, nowY);
    this.hero.prevWalkX = nowX;
    this.hero.prevWalkY = nowY;
    const dt = this.game.loop.delta / 1000;
    if (dt <= 0) {
      return;
    }
    // Accumulate distance/time over a short window so the speed reading is stable
    // even at high refresh rates (per-frame deltas are otherwise too noisy).
    this.hero.strideAccumDist = (this.hero.strideAccumDist ?? 0) + moved;
    this.hero.strideAccumTime = (this.hero.strideAccumTime ?? 0) + dt;
    if (this.hero.strideAccumTime < 0.05) {
      return;
    }
    // Ground speed in px/sec, corrected for perspective scale so a smaller (distant)
    // hero takes proportionally smaller steps.
    const scale = this.getCharacterScale(nowY);
    const speed = this.hero.strideAccumDist / this.hero.strideAccumTime;
    this.hero.strideAccumDist = 0;
    this.hero.strideAccumTime = 0;
    // Ground distance that should pass per animation frame to keep a foot planted.
    const stridePxPerFrame = 24 * scale;
    const desiredFps = Phaser.Math.Clamp(speed / stridePxPerFrame, 6, 16);
    // Base animation frameRate is 10fps, so timeScale scales it to the desired cadence.
    this.hero.sprite.anims.timeScale = desiredFps / 10;
  }

  updateHeroWalkPose(dx = 0, dy = 0) {
    if (!this.hero?.sprite || !this.hero.walkStartedAt) {
      return;
    }
    const facing = this.getFacingFromDelta(dx, dy);
    const phase = ((this.time.now - this.hero.walkStartedAt) / 1000) * Math.PI * 2.5;
    const stepLift = Math.abs(Math.sin(phase)) * 4;
    const sway = Math.sin(phase) * 2;
    const sideSign = dx < 0 ? -1 : 1;
    this.hero.sprite.y = -stepLift;
    this.hero.sprite.x = facing === "side" ? 0 : sway * 0.45;
    this.hero.sprite.angle = facing === "side" ? sideSign * Math.sin(phase) * 1.2 : Math.sin(phase) * 0.7;
    this.hero.fireBounce.y = -42 - stepLift * 0.55;
    this.hero.shadow.setScale(1 + stepLift * 0.018, 1 - stepLift * 0.012);
    this.hero.shadowOuter.setScale(1 + stepLift * 0.012, 1);
  }

  getFacingFromDelta(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 0.85) {
      return "side";
    }
    return dy < 0 ? "up" : "down";
  }

  setHeroIdle(facing = this.hero.facing, expression = "normal") {
    this.hero.sprite.anims.stop();
    this.hero.sprite.anims.timeScale = 1;
    this.hero.facing = facing;
    this.hero.expression = expression;
    this.hero.walkStartedAt = 0;
    this.hero.sprite.x = 0;
    this.hero.sprite.y = 0;
    this.hero.sprite.angle = 0;
    this.hero.fireBounce.y = -42;
    this.hero.shadow.setScale(1, 1);
    this.hero.shadowOuter.setScale(1, 1);
    const downFrames = { normal: 24, curious: 25, smile: 26, surprised: 27, thinking: 28, focused: 29 };
    const sideFrames = { normal: 40, curious: 41, smile: 42, surprised: 43, thinking: 44, focused: 45 };
    if (facing === "up") {
      this.hero.sprite.setFlipX(false);
      this.hero.sprite.setFrame(32);
      return;
    }
    if (facing === "side") {
      this.hero.sprite.setFrame(sideFrames[expression] || sideFrames.normal);
      return;
    }
    this.hero.sprite.setFlipX(false);
    this.hero.sprite.setFrame(downFrames[expression] || downFrames.normal);
  }

  faceHeroToward(x, y, expression = "normal") {
    const dx = x - this.hero.x;
    const dy = y - this.hero.y;
    const facing = this.getFacingFromDelta(dx, dy);
    if (facing === "side") {
      this.hero.sprite.setFlipX(dx < 0);
    }
    this.setHeroIdle(facing, expression);
  }

  setHeroExpression(expression) {
    this.setHeroIdle("down", expression);
    if (this.heroExpressionTimer) {
      this.heroExpressionTimer.remove(false);
    }
    this.heroExpressionTimer = this.time.delayedCall(1400, () => {
      const isWalking = this.heroTween?.isPlaying && this.heroTween.isPlaying();
      if (!isWalking) {
        this.setHeroIdle("down", "normal");
      }
    });
  }

  playGuideTalk(duration = 1300) {
    if (!this.guide?.sprite) {
      return;
    }
    this.guide.sprite.play("guide-talk", true);
    if (this.guideTalkTimer) {
      this.guideTalkTimer.remove(false);
    }
    this.guideTalkTimer = this.time.delayedCall(duration, () => {
      if (this.guide?.sprite) {
        this.guide.sprite.play("guide-idle", true);
      }
    });
  }

  openObjectIntro(hotspot) {
    if (this.learnedWords.includes(hotspot.id)) {
      this.openObjectQuestion(hotspot, 0);
      return;
    }
    if (this.validatedItemTranslations.has(hotspot.id)) {
      this.openObjectQuestion(hotspot, 0);
      return;
    }
    this.faceHeroToward(hotspot.x, hotspot.y, "curious");
    this.showSpeechBubble({
      speaker: "Alex",
      text: hotspot.intro.text,
      bg: hotspot.intro.bg,
      anchor: { x: hotspot.x, y: hotspot.y - 40 },
      onClose: () => {
        this.closeBubble();
        this.setCommand(`Looked at ${hotspot.label}`);
      },
      options: this.getTranslationCheckOptions(hotspot).map((option) => ({
        text: option.text,
        action: () => this.handleTranslationCheckOption(hotspot, option),
      })),
    });
  }

  getTranslationCheckSource(target) {
    return {
      text: target.intro?.text || target.mission || "",
      bg: target.intro?.bg || target.mission_bg || target.bg || "",
      check: target.intro?.translation_check || target.translation_check || null,
    };
  }

  getTranslationCheckOptions(target, previousOrder = null) {
    const source = this.getTranslationCheckSource(target);
    const check = source.check;
    if (!Array.isArray(check?.options) || check.options.length === 0) {
      return [{
        text: source.bg,
        isCorrect: true,
      }];
    }

    const shuffled = [...check.options];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      Phaser.Utils.Array.Shuffle(shuffled);
      const order = shuffled.map((option) => option.text).join("|");
      if (!previousOrder || order !== previousOrder) {
        return shuffled;
      }
    }
    shuffled.push(shuffled.shift());
    return shuffled;
  }

  getShuffledChallengeOptions(options) {
    if (!Array.isArray(options) || options.length < 2) {
      return options || [];
    }
    const originalOrder = options.map((option) => option.text).join("|");
    const isCorrectOption = (option) => option.isCorrect === true || option.is_correct === true;
    const shuffled = [...options];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      Phaser.Utils.Array.Shuffle(shuffled);
      if (shuffled.map((option) => option.text).join("|") !== originalOrder && !isCorrectOption(shuffled[0])) {
        return shuffled;
      }
    }

    if (isCorrectOption(shuffled[0])) {
      const correctOption = shuffled.shift();
      shuffled.splice(Phaser.Math.Between(1, shuffled.length), 0, correctOption);
    }
    if (shuffled.map((option) => option.text).join("|") === originalOrder) {
      const shiftBy = Phaser.Math.Between(1, shuffled.length - 1);
      const rotated = [...shuffled.slice(shiftBy), ...shuffled.slice(0, shiftBy)];
      if (isCorrectOption(rotated[0])) {
        const correctOption = rotated.shift();
        rotated.splice(Phaser.Math.Between(1, rotated.length), 0, correctOption);
      }
      return rotated;
    }
    return shuffled;
  }

  handleTranslationCheckOption(hotspot, option) {
    if (option.isCorrect) {
      this.validatedItemTranslations.add(hotspot.id);
      this.closeBubble();
      this.setCommand(`${hotspot.label} translation matched`);
      this.time.delayedCall(120, () => this.openObjectQuestion(hotspot, 0));
      return;
    }

    const previousOrder = this.activeBubble?.translationChoiceOrder || null;
    this.showTranslationValidationPenalty(hotspot, previousOrder);
  }

  showTranslationValidationPenalty(hotspot, previousOrder, retryAction = null) {
    const check = this.getTranslationCheckSource(hotspot).check || {};
    this.closeBubble();
    this.setCommand(`Checking ${hotspot.label} translation`);

    const width = 520;
    const height = 188;
    const preferredX = hotspot.x > GAME_WIDTH * 0.55 ? hotspot.x - width - 42 : hotspot.x - width * 0.5;
    const x = Phaser.Math.Clamp(preferredX, 32, GAME_WIDTH - width - 32);
    const y = Phaser.Math.Clamp(hotspot.y - height - 74, 58, 340);
    const bubble = this.add.container(x, y).setDepth(950);
    const panel = this.add.graphics();
    this.drawDialoguePanel(panel, width, height);
    const title = this.add.text(32, 36, check.validating_text || "Validating...", {
      fontFamily: ADVENTURE_FONT,
      fontSize: "25px",
      fontStyle: "700",
      color: "#123937",
    }).setOrigin(0, 0.5);
    const note = this.add.text(32, 74, check.retry_text || "Read the English sentence once more.", {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "700",
      color: "#526763",
    }).setOrigin(0, 0.5);
    const bar = this.add.graphics();
    const state = { progress: 0 };
    const drawBar = () => {
      bar.clear();
      bar.fillStyle(0x4d3322, 0.18);
      bar.fillRoundedRect(32, 112, width - 64, 24, 12);
      bar.fillStyle(0xffedbd, 1);
      bar.lineStyle(2, 0x9b7343, 0.72);
      bar.fillRoundedRect(32, 112, width - 64, 24, 12);
      bar.strokeRoundedRect(32, 112, width - 64, 24, 12);
      bar.fillStyle(0x0f7a78, 0.95);
      bar.fillRoundedRect(36, 116, Math.max(8, (width - 72) * state.progress), 16, 8);
    };
    drawBar();
    bubble.add([panel, title, note, bar]);
    bubble.isValidationPenalty = true;
    this.activeBubble = bubble;
    this.tweens.add({
      targets: state,
      progress: 1,
      duration: 3000,
      ease: "Sine.easeInOut",
      onUpdate: drawBar,
      onComplete: () => {
        if (this.activeBubble === bubble) {
          this.closeBubble();
          if (retryAction) {
            retryAction(previousOrder);
          } else {
            this.openObjectTranslationRetry(hotspot, previousOrder);
          }
        }
      },
    });
  }

  openObjectTranslationRetry(hotspot, previousOrder) {
    this.faceHeroToward(hotspot.x, hotspot.y, "curious");
    const options = this.getTranslationCheckOptions(hotspot, previousOrder);
    this.showSpeechBubble({
      speaker: "Alex",
      text: hotspot.intro.text,
      bg: hotspot.intro.bg,
      anchor: { x: hotspot.x, y: hotspot.y - 40 },
      onClose: () => {
        this.closeBubble();
        this.setCommand(`Paused ${hotspot.label} translation`);
      },
      options: options.map((option) => ({
        text: option.text,
        action: () => this.handleTranslationCheckOption(hotspot, option),
      })),
    });
  }

  getLevelIntroPlan() {
    return this.contentModel?.level_plan || this.camp?.level_plan || null;
  }

  getLevelIntroId() {
    return this.contentModel?.scene_id || this.camp?.id || "camp";
  }

  createLevelIntroTarget(plan) {
    return {
      id: `level_intro:${this.getLevelIntroId()}`,
      label: "mission",
      x: GAME_WIDTH / 2,
      y: 330,
      mission: plan.mission,
      mission_bg: plan.mission_bg,
      translation_check: plan.translation_check,
    };
  }

  openLevelIntro(force = false) {
    const plan = this.getLevelIntroPlan();
    if (!plan?.mission || this.activeBubble) {
      return;
    }
    const sceneId = this.getLevelIntroId();
    const alreadyUnderstood = this.validatedSceneIntroTranslations.has(sceneId);
    if (alreadyUnderstood && !force) {
      return;
    }
    this.setCommand("Read the mission");
    this.faceHeroToward(GAME_WIDTH / 2, 220, "curious");
    const target = this.createLevelIntroTarget(plan);
    const options = alreadyUnderstood
      ? [{ text: "OK", action: () => this.closeBubble() }]
      : this.getTranslationCheckOptions(target).map((option) => ({
        text: option.text,
        action: () => this.handleLevelIntroTranslationOption(target, option),
      }));
    this.showSpeechBubble({
      speaker: plan.title || "Mission",
      text: plan.mission,
      bg: plan.mission_bg,
      anchor: { x: GAME_WIDTH / 2, y: 156 },
      onClose: () => {
        this.closeBubble();
        this.setCommand("Mission paused");
      },
      options,
    });
  }

  handleLevelIntroTranslationOption(target, option) {
    if (option.isCorrect) {
      this.validatedSceneIntroTranslations.add(this.getLevelIntroId());
      this.closeBubble();
      this.setCommand("Mission understood");
      return;
    }
    const previousOrder = this.activeBubble?.translationChoiceOrder || null;
    this.showTranslationValidationPenalty(target, previousOrder, (retryPreviousOrder) => {
      this.openLevelIntroTranslationRetry(retryPreviousOrder);
    });
  }

  openLevelIntroTranslationRetry(previousOrder) {
    const plan = this.getLevelIntroPlan();
    if (!plan?.mission) {
      return;
    }
    const target = this.createLevelIntroTarget(plan);
    const options = this.getTranslationCheckOptions(target, previousOrder);
    this.showSpeechBubble({
      speaker: plan.title || "Mission",
      text: plan.mission,
      bg: plan.mission_bg,
      anchor: { x: GAME_WIDTH / 2, y: 156 },
      onClose: () => {
        this.closeBubble();
        this.setCommand("Mission paused");
      },
      options: options.map((option) => ({
        text: option.text,
        action: () => this.handleLevelIntroTranslationOption(target, option),
      })),
    });
  }

  openSceneryBubble(hotspot) {
    this.faceHeroToward(hotspot.x, hotspot.y, "curious");
    this.showSpeechBubble({
      speaker: "Alex",
      text: hotspot.description.text,
      bg: hotspot.description.bg,
      anchor: { x: hotspot.x, y: hotspot.y - 40 },
      options: [{ text: "OK", action: () => this.closeBubble() }],
    });
  }

  openObjectQuestion(hotspot, questionIndex) {
    if (this.learnedWords.includes(hotspot.id)) {
      this.setCommand(`${hotspot.label} already retrieved`);
      this.showVocabBubble(hotspot, true);
      return;
    }

    const quiz = this.objectQuizzes[hotspot.id];
    const question = quiz?.[questionIndex];
    if (!question) {
      this.retrieveHotspot(hotspot);
      return;
    }

    const expressions = { rope: "curious", backpack: "smile", map: "thinking" };
    this.setHeroExpression(expressions[hotspot.id] || "curious");
    this.showSpeechBubble({
      speaker: hotspot.label,
      text: question.text,
      bg: question.bg,
      anchor: { x: hotspot.x, y: hotspot.y - 40 },
      onClose: () => {
        this.closeBubble();
        this.setCommand(`Paused ${hotspot.label} challenge`);
      },
      options: this.getShuffledChallengeOptions(question.options).map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
        action: () => this.handleObjectQuizOption(hotspot, questionIndex, option),
      })),
    });
  }

  handleObjectQuizOption(hotspot, questionIndex, option) {
    if (!option.isCorrect) {
      this.activeBubble.showFeedback(option.feedback);
      return;
    }

    const nextIndex = questionIndex + 1;
    if (nextIndex < this.objectQuizzes[hotspot.id].length) {
      this.closeBubble();
      this.time.delayedCall(120, () => this.openObjectQuestion(hotspot, nextIndex));
      return;
    }

    this.closeBubble();
    this.retrieveHotspot(hotspot);
  }

  retrieveHotspot(hotspot) {
    if (!this.learnedWords.includes(hotspot.id)) {
      this.learnedWords.push(hotspot.id);
      this.updateInventory();
      this.drawHotspotGlow(hotspot, true);
      hotspot.marker.setAlpha(0.95);
    }
    const expressions = { rope: "curious", backpack: "smile", map: "thinking" };
    this.setHeroExpression(expressions[hotspot.id] || "curious");
    this.showVocabBubble(hotspot, false);
  }

  showVocabBubble(hotspot, alreadyRetrieved = false) {
    this.closeBubble();
    const bubble = this.add.container(hotspot.x, hotspot.y - 100).setDepth(930);
    const expressionFrames = { rope: 1, backpack: 4, map: 5 };
    const portrait = this.add.sprite(-105, 0, "heroPortraits", expressionFrames[hotspot.id] ?? 3)
      .setScale(0.68)
      .setOrigin(0.5);
    const bg = this.add.graphics();
    bg.fillStyle(0xfffbef, 0.96);
    bg.lineStyle(3, 0xffcf5a, 0.88);
    bg.fillRoundedRect(-156, -50, 312, 100, 16);
    bg.strokeRoundedRect(-156, -50, 312, 100, 16);
    bg.fillStyle(0xf6dda4, 0.95);
    bg.fillRoundedRect(-148, -42, 86, 84, 12);
    const label = this.add.text(-42, -26, alreadyRetrieved ? "Retrieved" : "New word", { fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: "#526763" }).setOrigin(0, 0.5);
    const word = this.add.text(-42, -3, hotspot.english, { fontFamily: ADVENTURE_FONT, fontSize: "30px", fontStyle: "700", color: "#0d5552" }).setOrigin(0, 0.5);
    const translation = this.add.text(-42, 27, hotspot.bg, { fontFamily: UI_FONT, fontSize: "19px", color: "#2b342f" }).setOrigin(0, 0.5);
    bubble.add([bg, portrait, label, word, translation]);
    this.activeBubble = bubble;
    this.time.delayedCall(1600, () => {
      if (this.activeBubble === bubble) {
        this.closeBubble();
      }
    });
  }

  openInventoryDetail(hotspot) {
    const detail = this.getInventoryDetail(hotspot);
    this.setCommand(`Look at ${hotspot.label}`);
    this.showSpeechBubble({
      speaker: hotspot.label,
      text: detail.text,
      bg: detail.bg,
      anchor: { x: 140, y: 126 },
      options: [{ text: "OK", action: () => this.closeBubble() }],
    });
  }

  getInventoryDetail(hotspot) {
    const configuredDetail = hotspot.inventory?.detail || hotspot.detail || hotspot.details;
    return {
      text: configuredDetail?.text || hotspot.intro?.text || `This is ${hotspot.english || hotspot.label}.`,
      bg: configuredDetail?.bg || hotspot.intro?.bg || hotspot.bg || "",
    };
  }

  showInventoryTooltip(slot, hotspot) {
    this.hideInventoryTooltip();
    const label = this.add.text(0, 0, hotspot.label, {
      fontFamily: UI_FONT,
      fontSize: "14px",
      fontStyle: "700",
      color: "#173837",
    }).setOrigin(0.5);
    const paddingX = 10;
    const width = Math.ceil(label.width + paddingX * 2);
    const height = 28;
    const x = Phaser.Math.Clamp(this.inventoryItems.x + slot.x, 42, 220);
    const y = this.inventoryItems.y + slot.y + 38;
    const tooltip = this.add.container(x, y).setDepth(980);
    const bg = this.add.graphics();
    bg.fillStyle(0x4d3322, 0.16);
    bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 3, width, height, 8);
    bg.fillStyle(0xfff4c4, 1);
    bg.lineStyle(2, 0x8b6336, 0.94);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    tooltip.add([bg, label]);
    this.inventoryTooltip = tooltip;
  }

  hideInventoryTooltip() {
    if (this.inventoryTooltip) {
      this.inventoryTooltip.destroy();
      this.inventoryTooltip = null;
    }
  }

  createInventorySlot(hotspot, index) {
    const slotSize = 44;
    const slot = this.add.container(index * 50, 0)
      .setSize(slotSize, slotSize);
    const bg = this.add.graphics();
    const redraw = (state) => {
      const hover = state === "hover";
      const down = state === "down";
      bg.clear();
      bg.fillStyle(0x2c1c13, 0.32);
      bg.fillRoundedRect(-slotSize / 2 + 3, -slotSize / 2 + 4, slotSize, slotSize, 9);
      bg.fillStyle(down ? 0xf0bd55 : hover ? 0xffd77a : 0xffedbd, 1);
      bg.lineStyle(3, hover || down ? 0xf0b74f : 0x9b7343, hover || down ? 1 : 0.86);
      bg.fillRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 8);
      bg.strokeRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 8);
      bg.lineStyle(1, 0xfffbef, hover ? 0.76 : 0.42);
      bg.strokeRoundedRect(-slotSize / 2 + 6, -slotSize / 2 + 6, slotSize - 12, slotSize - 12, 6);
      bg.fillStyle(0x7b4d25, 0.52);
      bg.fillCircle(-slotSize / 2 + 7, -slotSize / 2 + 7, 2.4);
      bg.fillCircle(slotSize / 2 - 7, -slotSize / 2 + 7, 2.4);
    };
    redraw("idle");

    const icon = this.createInventoryIcon(hotspot, 35);
    const hitPlate = this.add.zone(0, 0, slotSize, slotSize)
      .setInteractive({ useHandCursor: true });
    slot.add([bg, icon, hitPlate]);
    slot.bg = bg;
    slot.icon = icon;
    slot.hitPlate = hitPlate;
    slot.hotspot = hotspot;
    slot.isInventorySlot = true;

    hitPlate.on("pointerover", () => {
      slot.hoverState = "hover";
      redraw("hover");
      this.showInventoryTooltip(slot, hotspot);
    });
    hitPlate.on("pointerout", () => {
      slot.hoverState = "idle";
      redraw("idle");
      this.hideInventoryTooltip();
    });
    hitPlate.on("pointerdown", () => {
      slot.hoverState = "down";
      redraw("down");
      this.hideInventoryTooltip();
      this.openInventoryDetail(hotspot);
    });
    hitPlate.on("pointerup", () => {
      slot.hoverState = "hover";
      redraw("hover");
    });
    return slot;
  }

  createEmptyInventorySlot(itemId, index) {
    const slotSize = 44;
    const slot = this.add.container(index * 50, 0)
      .setSize(slotSize, slotSize);
    const bg = this.add.graphics();
    bg.fillStyle(0x2c1c13, 0.22);
    bg.fillRoundedRect(-slotSize / 2 + 3, -slotSize / 2 + 4, slotSize, slotSize, 9);
    bg.fillStyle(0x4f3928, 0.58);
    bg.lineStyle(2, 0xe2b661, 0.48);
    bg.fillRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 8);
    bg.strokeRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 8);
    bg.lineStyle(2, 0xffefba, 0.2);
    bg.strokeRoundedRect(-slotSize / 2 + 7, -slotSize / 2 + 7, slotSize - 14, slotSize - 14, 6);
    bg.fillStyle(0xffefba, 0.68);
    bg.fillRoundedRect(-6, -2, 12, 13, 3);
    bg.lineStyle(3, 0xffefba, 0.5);
    bg.beginPath();
    bg.arc(0, -3, 8, Math.PI, 0);
    bg.strokePath();
    const label = this.add.text(0, 3, "?", {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "800",
      color: "#4f3928",
    }).setOrigin(0.5);
    slot.add([bg, label]);
    slot.itemId = itemId;
    slot.isEmptyInventorySlot = true;
    return slot;
  }

  createInventoryIcon(hotspot, maxSize) {
    const spec = this.getInventoryIconSpec(hotspot);
    if (spec && this.textures.exists(spec.texture)) {
      const frameKey = this.ensureInventoryIconFrame(hotspot, spec);
      if (frameKey) {
        const image = this.add.image(0, 0, spec.texture, frameKey).setOrigin(0.5);
        const frame = this.textures.getFrame(spec.texture, frameKey);
        const scale = Math.min(maxSize / frame.width, maxSize / frame.height);
        image.setScale(scale);
        return image;
      }
    }
    return this.createFallbackInventoryIcon(hotspot, maxSize);
  }

  getInventoryIconSpec(hotspot) {
    const configuredIcon = hotspot.inventory?.icon || hotspot.icon;
    if (configuredIcon?.texture && configuredIcon?.frame) {
      return { texture: configuredIcon.texture, frame: configuredIcon.frame };
    }
    if (configuredIcon?.source && configuredIcon?.frame) {
      return { texture: configuredIcon.source, frame: configuredIcon.frame };
    }
    if (!this.textures.exists("campBg")) {
      return null;
    }
    const texture = this.textures.get("campBg");
    const source = texture.getSourceImage();
    const scaleX = source.width / GAME_WIDTH;
    const scaleY = source.height / GAME_HEIGHT;
    const sourceSize = Math.max(58, hotspot.radius * 2.25 * Math.max(scaleX, scaleY));
    const centerX = hotspot.x * scaleX;
    const centerY = hotspot.y * scaleY;
    return {
      texture: "campBg",
      frame: {
        x: Math.round(Phaser.Math.Clamp(centerX - sourceSize / 2, 0, source.width - sourceSize)),
        y: Math.round(Phaser.Math.Clamp(centerY - sourceSize / 2, 0, source.height - sourceSize)),
        width: Math.round(sourceSize),
        height: Math.round(sourceSize),
      },
    };
  }

  ensureInventoryIconFrame(hotspot, spec) {
    const texture = this.textures.get(spec.texture);
    const frame = spec.frame;
    if (!texture || !frame) {
      return null;
    }
    const source = texture.getSourceImage();
    const width = Math.round(frame.width);
    const height = Math.round(frame.height);
    const x = Math.round(Phaser.Math.Clamp(frame.x, 0, Math.max(0, source.width - width)));
    const y = Math.round(Phaser.Math.Clamp(frame.y, 0, Math.max(0, source.height - height)));
    if (width <= 0 || height <= 0) {
      return null;
    }
    const frameKey = `inventory-${hotspot.id}`;
    if (!texture.has(frameKey)) {
      texture.add(frameKey, 0, x, y, Math.min(width, source.width - x), Math.min(height, source.height - y));
    }
    return frameKey;
  }

  createFallbackInventoryIcon(hotspot, maxSize) {
    const icon = this.add.container(0, 0).setSize(maxSize, maxSize);
    const art = this.add.graphics();
    const id = hotspot.id;
    if (id.includes("rope")) {
      art.lineStyle(4, 0x8d5b2f, 1);
      art.strokeCircle(0, 0, 9);
      art.strokeCircle(7, -1, 9);
      art.lineStyle(2, 0xffd98a, 0.86);
      art.strokeCircle(0, 0, 5);
    } else if (id.includes("backpack") || id.includes("bag")) {
      art.fillStyle(0x375d76, 1);
      art.fillRoundedRect(-12, -6, 24, 20, 6);
      art.lineStyle(3, 0x9a6a32, 1);
      art.strokeRoundedRect(-12, -6, 24, 20, 6);
      art.lineStyle(3, 0x273946, 1);
      art.beginPath();
      art.arc(0, -6, 8, Math.PI, 0);
      art.strokePath();
    } else if (id.includes("map") || id.includes("form") || id.includes("dossier")) {
      art.fillStyle(0xf5d894, 1);
      art.fillRoundedRect(-12, -14, 24, 28, 3);
      art.lineStyle(2, 0x8b6336, 1);
      art.strokeRoundedRect(-12, -14, 24, 28, 3);
      art.lineStyle(2, 0x0f7a78, 0.8);
      art.beginPath();
      art.moveTo(-7, -5);
      art.lineTo(0, -9);
      art.lineTo(8, -4);
      art.strokePath();
    } else if (id.includes("badge")) {
      art.fillStyle(0xf4c44e, 1);
      art.fillCircle(0, -2, 11);
      art.lineStyle(3, 0x6b4b20, 1);
      art.strokeCircle(0, -2, 11);
      art.fillStyle(0xfffbef, 1);
      art.fillRoundedRect(-8, 8, 16, 9, 3);
    } else if (id.includes("phone")) {
      art.fillStyle(0x1e2b2d, 1);
      art.fillRoundedRect(-13, -10, 26, 20, 4);
      art.fillStyle(0xffefba, 0.9);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          art.fillCircle(-6 + col * 6, -4 + row * 5, 1.5);
        }
      }
    } else if (id.includes("camera")) {
      art.fillStyle(0x283136, 1);
      art.fillRoundedRect(-13, -9, 26, 18, 4);
      art.fillStyle(0x162024, 1);
      art.fillCircle(-2, 0, 8);
      art.lineStyle(3, 0x76d6df, 0.9);
      art.strokeCircle(-2, 0, 5);
      art.fillStyle(0xf0473f, 1);
      art.fillCircle(9, -5, 2);
    } else {
      art.fillStyle(0xf4c44e, 1);
      art.fillCircle(0, 0, 12);
      art.lineStyle(3, 0x0f7a78, 1);
      art.strokeCircle(0, 0, 12);
    }
    icon.add(art);
    return icon;
  }

  openGuideQuestion(nodeId) {
    const node = this.guideTree.nodes[nodeId];
    this.playGuideTalk();
    this.showSpeechBubble({
      speaker: node.speaker,
      text: node.npc_text,
      bg: node.npc_text_bg,
      anchor: { x: this.guide.x, y: this.guide.y - 128 },
      options: this.getShuffledChallengeOptions(node.options).map((option) => ({
        text: option.text,
        isCorrect: option.is_correct,
        action: () => this.handleGuideOption(option),
      })),
    });
  }

  handleGuideOption(option) {
    if (!option.is_correct) {
      this.activeBubble.showFeedback(option.feedback_bg);
      return;
    }
    if (option.next_node) {
      this.closeBubble();
      this.openGuideQuestion(option.next_node);
      return;
    }
    if (option.action?.type === "set_flag") {
      this.flags[option.action.flag] = true;
      this.statusText.setText("Jungle path open");
      this.exitMarker.getAt(0).clear();
      this.exitMarker.getAt(0).fillStyle(0xf4c44e, 1);
      this.exitMarker.getAt(0).fillRoundedRect(-18, -18, 36, 36, 8);
    }
    this.closeBubble();
    this.flashToast("Jungle path unlocked!");
  }

  showSpeechBubble({ speaker, text, bg, anchor, options, onClose = null, revealTranslations = true }) {
    this.closeBubble();
    const width = 660;
    const longChoice = options.some((option) => option.text.length > 58);
    const optionHeight = longChoice ? 72 : 52;
    const choiceHeight = longChoice ? 62 : 42;
    const feedbackReserve = 104;
    const hiddenFeedbackReserve = 26;
    const speakerTitle = speaker ? `${speaker[0].toUpperCase()}${speaker.slice(1)}` : "";
    const textFlow = this.createRevealTextFlow(30, 61, text, width - 62, {
      fontFamily: UI_FONT,
      fontSize: "23px",
      fontStyle: "700",
      color: "#172321",
      lineSpacing: 8,
      revealTranslations,
    });
    const choicesY = Math.max(132, 61 + textFlow.contentHeight + 22);
    const feedbackY = choicesY + options.length * optionHeight + 10;
    const initialHeight = feedbackY + hiddenFeedbackReserve;
    const preferredX = anchor.x > GAME_WIDTH * 0.55 ? anchor.x - width - 42 : anchor.x - width * 0.5;
    const x = Phaser.Math.Clamp(preferredX, 32, GAME_WIDTH - width - 32);
    const y = Phaser.Math.Clamp(anchor.y - initialHeight - 24, 58, 340);
    const bubble = this.add.container(x, y).setDepth(950);

    const panel = this.add.graphics();
    this.drawDialoguePanel(panel, width, initialHeight);

    const speakerRibbon = this.add.graphics();
    const ribbonWidth = Phaser.Math.Clamp(speakerTitle.length * 16 + 40, 132, 236);
    speakerRibbon.fillStyle(0x4f2f1e, 0.22);
    speakerRibbon.fillRoundedRect(19, 18, ribbonWidth, 34, 9);
    speakerRibbon.fillStyle(0x174846, 0.96);
    speakerRibbon.fillRoundedRect(16, 14, ribbonWidth, 34, 9);
    speakerRibbon.fillStyle(0xf0b74f, 1);
    speakerRibbon.fillRoundedRect(16, 14, 8, 34, 4);
    speakerRibbon.lineStyle(1, 0xfff2cf, 0.38);
    speakerRibbon.strokeRoundedRect(24, 18, ribbonWidth - 12, 25, 7);

    const speakerBadge = this.add.text(32, 16, speakerTitle,
    {
      fontFamily: ADVENTURE_FONT,
      fontSize: "19px",
      fontStyle: "700",
      color: "#fff4cf",
    });
    const closeButton = onClose ? this.makeCloseButton(width - 51, 17, onClose) : null;

    const choices = options.map((option, index) => {
      const choice = this.makeChoice(
        32,
        choicesY + index * optionHeight,
        width - 64,
        choiceHeight,
        option.text,
        option.action,
      );
      choice.choiceData = option;
      return choice;
    });

    bubble.add([panel, speakerRibbon, speakerBadge, textFlow, ...choices]);
    if (closeButton) {
      bubble.add(closeButton);
    }

    const feedbackBg = this.add.graphics().setVisible(false);
    const feedbackNote = this.add.text(36, feedbackY + 8, "", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "700",
      color: "#31432d",
      lineSpacing: 3,
      wordWrap: { width: width - 92 },
    }).setVisible(false);
    const drawFeedback = () => {
      const noteHeight = Math.min(feedbackNote.height + 18, feedbackReserve - 14);
      const expandedHeight = feedbackY + noteHeight + 18;
      const expandedY = Phaser.Math.Clamp(anchor.y - expandedHeight - 24, 58, 340);
      bubble.setY(Math.min(bubble.y, expandedY));
      this.drawDialoguePanel(panel, width, expandedHeight);
      feedbackBg.clear();
      feedbackBg.fillStyle(0x4d3322, 0.15);
      feedbackBg.fillRoundedRect(23, feedbackY + 4, width - 46, noteHeight, 9);
      feedbackBg.fillStyle(0xffe9b4, 0.98);
      feedbackBg.lineStyle(2, 0x7b9a55, 0.68);
      feedbackBg.fillRoundedRect(20, feedbackY, width - 46, noteHeight, 9);
      feedbackBg.strokeRoundedRect(20, feedbackY, width - 46, noteHeight, 9);
      feedbackBg.fillStyle(0x0f7a78, 0.86);
      feedbackBg.fillRoundedRect(20, feedbackY, 7, noteHeight, 3);
      feedbackBg.lineStyle(1, 0xfffbef, 0.45);
      feedbackBg.strokeRoundedRect(29, feedbackY + 6, width - 66, noteHeight - 12, 7);
    };
    bubble.showFeedback = (feedback) => {
      feedbackNote.setText(feedback);
      drawFeedback();
      feedbackBg.setVisible(true);
      feedbackNote.setVisible(true);
    };
    bubble.feedbackBg = feedbackBg;
    bubble.feedbackNote = feedbackNote;
    bubble.translationChoiceOrder = options.map((option) => option.text).join("|");
    bubble.add([feedbackBg, feedbackNote]);

    this.activeBubble = bubble;
  }

  drawDialoguePanel(graphics, width, height) {
    graphics.clear();
    graphics.fillStyle(0x0b1d18, 0.3);
    graphics.fillRoundedRect(7, 9, width, height, 18);
    graphics.fillStyle(0xb77a2f, 0.98);
    graphics.fillRoundedRect(-5, -5, width + 10, height + 10, 22);
    graphics.fillStyle(0xfff2cf, 0.99);
    graphics.fillRoundedRect(0, 0, width, height, 18);
    graphics.lineStyle(4, 0x77502d, 0.98);
    graphics.strokeRoundedRect(0, 0, width, height, 18);
    graphics.lineStyle(2, 0xf8d98c, 0.72);
    graphics.strokeRoundedRect(11, 11, width - 22, height - 22, 14);
    graphics.fillStyle(0xffe2a1, 0.28);
    graphics.fillRoundedRect(18, 52, width - 36, Math.max(72, height - 84), 14);
    graphics.lineStyle(2, 0xc18a39, 0.18);
    graphics.beginPath();
    graphics.moveTo(width - 112, 23);
    graphics.lineTo(width - 70, 49);
    graphics.lineTo(width - 104, 83);
    graphics.lineTo(width - 140, 111);
    graphics.lineTo(width - 82, 142);
    graphics.strokePath();
    graphics.fillStyle(0x7b4d25, 0.45);
    graphics.fillCircle(31, 27, 6);
    graphics.fillCircle(width - 31, 27, 6);
    graphics.fillCircle(31, height - 27, 6);
    graphics.fillCircle(width - 31, height - 27, 6);
    graphics.lineStyle(2, 0xfff2cf, 0.5);
    graphics.strokeCircle(31, 27, 4);
    graphics.strokeCircle(width - 31, 27, 4);
    graphics.strokeCircle(31, height - 27, 4);
    graphics.strokeCircle(width - 31, height - 27, 4);
  }

  createRevealTextFlow(x, y, text, maxWidth, style) {
    const flow = this.add.container(x, y);
    const tokens = text.match(/\S+|\s+/g) || [];
    const fontSize = Number.parseInt(style.fontSize, 10) || 20;
    const lineHeight = fontSize + (style.lineSpacing ?? 6);
    const spaceWidth = this.measureTextWidth(" ", style);
    let cursorX = 0;
    let cursorY = 0;
    let contentWidth = 0;

    tokens.forEach((token) => {
      if (/^\s+$/.test(token)) {
        cursorX += spaceWidth;
        return;
      }

      const translation = style.revealTranslations === false ? null : this.getWordTranslation(token);
      const originalWidth = Math.ceil(this.measureTextWidth(token, style));
      const tokenWidth = originalWidth;

      if (cursorX > 0 && cursorX + tokenWidth > maxWidth) {
        cursorX = 0;
        cursorY += lineHeight;
      }

      const word = this.add.text(cursorX, cursorY, token, style).setOrigin(0, 0);
      word.originalText = token;
      word.translationText = translation ? this.withOriginalPunctuation(token, translation) : null;
      word.revealWidth = originalWidth;
      word.revealFlow = flow;

      if (word.translationText) {
        const bar = this.add.graphics();
        word.revealBar = bar;
        flow.add(bar);
        word.setInteractive(new Phaser.Geom.Rectangle(0, 0, originalWidth, lineHeight), Phaser.Geom.Rectangle.Contains);
        word.on("pointerdown", (pointer) => this.beginWordReveal(word, pointer));
        word.on("pointerout", (pointer) => {
          if (word.revealPointerId === pointer.id) {
            this.endWordReveal(word);
          }
        });
      }

      flow.add(word);
      cursorX += tokenWidth;
      contentWidth = Math.max(contentWidth, cursorX);
    });

    flow.contentHeight = cursorY + lineHeight;
    flow.contentWidth = Math.min(maxWidth, contentWidth);
    flow.maxWidth = maxWidth;
    return flow;
  }

  measureTextWidth(text, style) {
    const sample = this.add.text(-9999, -9999, text, style).setVisible(false);
    const width = sample.width;
    sample.destroy();
    return width;
  }

  getWordTranslation(token) {
    const key = token.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
    return REVEAL_TRANSLATIONS.get(key) || null;
  }

  withOriginalPunctuation(token, translation) {
    const prefix = token.match(/^[^a-zA-Z]+/)?.[0] || "";
    const suffix = token.match(/[^a-zA-Z]+$/)?.[0] || "";
    return `${prefix}${translation}${suffix}`;
  }

  beginWordReveal(word, pointer = null) {
    if (!word.translationText) {
      return;
    }
    this.endWordReveal(word, false);
    this.activeRevealWord = word;
    word.revealPointerId = pointer?.id ?? null;
    word.revealPressPoint = this.getRevealPressPoint(word, pointer);
    word.setColor("#0b5f5d");
    word.revealState = { progress: 0 };
    word.revealTween = this.tweens.add({
      targets: word.revealState,
      progress: 1,
      duration: WORD_REVEAL_HOLD_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => this.drawRevealProgress(word, word.revealState.progress),
      onComplete: () => {
        word.setColor("#172321");
        this.showTranslationBalloon(word);
        this.drawRevealProgress(word, 1);
      },
    });
  }

  getRevealPressPoint(word, pointer) {
    if (!pointer || !word.revealFlow) {
      return {
        x: word.x + word.revealWidth / 2,
        y: word.y,
      };
    }

    const matrix = word.revealFlow.getWorldTransformMatrix();
    const point = matrix.applyInverse(pointer.worldX, pointer.worldY);
    return {
      x: Phaser.Math.Clamp(point.x, word.x, word.x + word.revealWidth),
      y: Phaser.Math.Clamp(point.y, word.y, word.y + word.height),
    };
  }

  showTranslationBalloon(word) {
    this.clearTranslationBalloon(word);
    const text = this.add.text(0, 0, word.translationText, {
      fontFamily: UI_FONT,
      fontSize: "22px",
      fontStyle: "800",
      color: "#7a3e14",
    }).setOrigin(0, 0);
    const paddingX = 11;
    const paddingY = 5;
    const balloonWidth = Math.ceil(text.width + paddingX * 2);
    const balloonHeight = Math.ceil(text.height + paddingY * 2);
    const anchor = word.revealPressPoint || { x: word.x + word.revealWidth / 2, y: word.y };
    const centerX = anchor.x;
    const maxLeft = (word.revealFlow?.maxWidth ?? 620) - balloonWidth + 8;
    const balloonX = Phaser.Math.Clamp(centerX - balloonWidth / 2, -8, maxLeft);
    const preferredBalloonY = anchor.y - balloonHeight - 22;
    const balloonY = Math.min(preferredBalloonY, word.y - balloonHeight - 6);
    const bg = this.add.graphics();
    bg.fillStyle(0x4d3322, 0.18);
    bg.fillRoundedRect(balloonX + 2, balloonY + 3, balloonWidth, balloonHeight, 9);
    bg.fillStyle(0xfff4c4, 1);
    bg.lineStyle(2, 0x8b6336, 0.95);
    bg.fillRoundedRect(balloonX, balloonY, balloonWidth, balloonHeight, 9);
    bg.strokeRoundedRect(balloonX, balloonY, balloonWidth, balloonHeight, 9);
    text.setPosition(balloonX + paddingX, balloonY + paddingY - 1);
    word.translationBalloon = { bg, text, x: balloonX, y: balloonY, width: balloonWidth, height: balloonHeight };
    word.revealFlow.add([bg, text]);
  }

  clearTranslationBalloon(word) {
    if (!word.translationBalloon) {
      return;
    }
    word.translationBalloon.bg.destroy();
    word.translationBalloon.text.destroy();
    word.translationBalloon = null;
  }

  drawRevealProgress(word, progress) {
    word.revealBar.clear();
    word.revealBar.fillStyle(0xffcf5a, 0.26);
    word.revealBar.fillRoundedRect(word.x - 1, word.y - 5, word.revealWidth + 2, 5, 2);
    word.revealBar.fillStyle(0x0f7a78, 0.95);
    word.revealBar.fillRoundedRect(word.x - 1, word.y - 5, Math.max(3, (word.revealWidth + 2) * progress), 5, 2);
  }

  endWordReveal(word, resetText = true) {
    if (word.revealTween) {
      word.revealTween.stop();
      word.revealTween = null;
    }
    if (word.revealBar) {
      word.revealBar.clear();
    }
    this.clearTranslationBalloon(word);
    if (resetText) {
      word.setText(word.originalText);
      word.setColor("#172321");
    }
    if (this.activeRevealWord === word) {
      this.activeRevealWord = null;
    }
    word.revealPointerId = null;
    word.revealPressPoint = null;
  }

  resetRevealIfPointerLeft(pointer) {
    const word = this.activeRevealWord;
    if (!word?.active) {
      this.activeRevealWord = null;
      return;
    }
    if (word.revealPointerId !== null && word.revealPointerId !== pointer.id) {
      return;
    }
    const bounds = word.getBounds();
    Phaser.Geom.Rectangle.Inflate(bounds, 4, 8);
    if (!Phaser.Geom.Rectangle.Contains(bounds, pointer.worldX, pointer.worldY)) {
      this.endWordReveal(word);
    }
  }

  endActiveWordReveal(pointer) {
    const word = this.activeRevealWord;
    if (!word?.active) {
      this.activeRevealWord = null;
      return;
    }
    if (word.revealPointerId === null || word.revealPointerId === pointer.id) {
      this.endWordReveal(word);
    }
  }

  makeCloseButton(x, y, action) {
    const button = this.add.container(x, y).setSize(34, 34);
    const bg = this.add.graphics();
    const redraw = (state = "idle") => {
      const hover = state === "hover";
      const down = state === "down";
      bg.clear();
      bg.fillStyle(0x4d3322, 0.18);
      bg.fillRoundedRect(2, down ? 4 : 3, 32, 30, 9);
      bg.fillStyle(down ? 0xeab75d : hover ? 0xffdc83 : 0xffedbd, 1);
      bg.lineStyle(2, hover || down ? 0x0f7a78 : 0x8b6336, hover || down ? 0.95 : 0.72);
      bg.fillRoundedRect(0, 0, 32, 30, 9);
      bg.strokeRoundedRect(0, 0, 32, 30, 9);
      bg.lineStyle(3, 0x123937, hover || down ? 0.92 : 0.72);
      bg.beginPath();
      bg.moveTo(11, 9);
      bg.lineTo(21, 19);
      bg.moveTo(21, 9);
      bg.lineTo(11, 19);
      bg.strokePath();
    };
    redraw();
    const hitPlate = this.add.zone(16, 15, 34, 34).setInteractive({ useHandCursor: true });
    hitPlate.on("pointerover", () => redraw("hover"));
    hitPlate.on("pointerout", () => redraw("idle"));
    hitPlate.on("pointerdown", () => {
      redraw("down");
      action();
    });
    hitPlate.on("pointerup", () => redraw("hover"));
    button.add([bg, hitPlate]);
    button.hitPlate = hitPlate;
    button.isCloseButton = true;
    return button;
  }

  makeChoice(x, y, width, height, text, action) {
    const choice = this.add.container(x, y).setSize(width, height);
    const bg = this.add.graphics();
    const redraw = (state = "idle") => {
      choice.hoverState = state;
      const hover = state === "hover";
      const down = state === "down";
      bg.clear();
      bg.fillStyle(0x4d3322, down ? 0.25 : 0.18);
      bg.fillRoundedRect(4, down ? 5 : 4, width, height, 9);
      bg.fillStyle(down ? 0xf0bd55 : hover ? 0xffdc83 : 0xffedbd, 1);
      bg.lineStyle(3, hover || down ? 0x0f7a78 : 0x9b7343, hover || down ? 0.98 : 0.72);
      bg.fillRoundedRect(0, 0, width, height, 9);
      bg.strokeRoundedRect(0, 0, width, height, 9);
      bg.lineStyle(1, 0xfffbef, hover ? 0.72 : 0.38);
      bg.strokeRoundedRect(8, 7, width - 16, height - 14, 7);
    };
    redraw("idle");
    const label = this.add.text(width / 2, height / 2, text, {
      fontFamily: ADVENTURE_FONT,
      fontSize: text.length > 76 ? "15px" : text.length > 42 ? "17px" : text.length > 28 ? "18px" : "20px",
      fontStyle: "700",
      color: "#123937",
      align: "center",
      wordWrap: { width: width - 42 },
    }).setOrigin(0.5);
    const hitPlate = this.add.zone(width / 2, height / 2, width, height)
      .setInteractive({ useHandCursor: true });
    choice.add([bg, label, hitPlate]);
    choice.bg = bg;
    choice.label = label;
    choice.hitPlate = hitPlate;
    hitPlate.on("pointerover", () => {
      redraw("hover");
    });
    hitPlate.on("pointerout", () => {
      redraw("idle");
    });
    hitPlate.on("pointerdown", () => {
      redraw("down");
      action();
    });
    hitPlate.on("pointerup", () => {
      redraw("hover");
    });
    return choice;
  }

  updateInventory() {
    if (!this.inventoryItems) {
      return;
    }
    this.inventoryItems.removeAll(true);
    this.hideInventoryTooltip();
    this.inventoryText.setVisible(false);
    const expectedIds = this.getInventorySlotIds();
    expectedIds.forEach((itemId, index) => {
      const hotspot = this.hotspots?.find((candidate) => candidate.id === itemId);
      if (hotspot && this.learnedWords.includes(itemId)) {
        this.inventoryItems.add(this.createInventorySlot(hotspot, index));
        return;
      }
      this.inventoryItems.add(this.createEmptyInventorySlot(itemId, index));
    });
  }

  getInventorySlotIds() {
    const requiredItems = this.contentModel?.guide?.required_items;
    const collectibleIds = this.hotspots
      ?.filter((hotspot) => !hotspot.scenery)
      .map((hotspot) => hotspot.id) || [];
    const baseIds = Array.isArray(requiredItems) && requiredItems.length > 0 ? requiredItems : collectibleIds;
    return [...new Set([...this.learnedWords, ...baseIds])].slice(0, 3);
  }

  setCommand(text) {
    this.commandText.setText(text);
  }

  flashToast(text) {
    this.closeToast();
    const toast = this.add.container(GAME_WIDTH / 2, 512).setDepth(970);
    const bg = this.add.graphics();
    bg.fillStyle(0x1f2d24, 0.88);
    bg.fillRoundedRect(-160, -24, 320, 48, 10);
    const label = this.add.text(0, 0, text, {
      fontFamily: ADVENTURE_FONT,
      fontSize: "18px",
      fontStyle: "700",
      color: "#fff6d4",
    }).setOrigin(0.5);
    toast.add([bg, label]);
    this.toast = toast;
    this.time.delayedCall(1600, () => this.closeToast());
  }

  closeToast() {
    if (this.toast) {
      this.toast.destroy();
      this.toast = null;
    }
  }

  closeBubble() {
    if (this.activeBubble) {
      this.activeBubble.destroy();
      this.activeBubble = null;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#173837",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [CampScene],
};

const startGame = () => {
  window.phaserGame = new Phaser.Game(config);
};

if (document.fonts?.ready) {
  document.fonts.ready.then(startGame);
} else {
  startGame();
}
