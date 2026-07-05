(() => {
  "use strict";

  const CONTENT_CACHE_KEY = "gameContent";
  const DEFAULT_CONTENT_URL = "scenarios/james-bond-level-01-content.json?v=20260705-puzzle-eca-2";
  const ASSET_OVERRIDE_VERSION = "20260705-scenario-assets-1";
  const ADVENTURE_FONT = '"Merienda", "Trebuchet MS", "Georgia", serif';

  function getContentUrl() {
    const locationSearch = window.location?.search || "";
    const params = new URLSearchParams(locationSearch);
    const scenario = params.get("scenario");
    if (!scenario) {
      return DEFAULT_CONTENT_URL;
    }
    return scenario.includes("?") ? scenario : `${scenario}?v=20260705-puzzle-eca-2`;
  }

  const CONTENT_URL = getContentUrl();

  function loadContentManifest(url) {
    if (typeof XMLHttpRequest === "undefined") {
      return null;
    }
    try {
      const request = new XMLHttpRequest();
      request.open("GET", url, false);
      request.send(null);
      if (request.status >= 200 && request.status < 300) {
        return JSON.parse(request.responseText);
      }
    } catch (_error) {
      return null;
    }
    return null;
  }

  const CONTENT_MANIFEST = loadContentManifest(CONTENT_URL);

  function versionedScenarioAsset(path) {
    return `${path}?v=${ASSET_OVERRIDE_VERSION}`;
  }

  function normalizeHotspot(rawHotspot) {
    return {
      ...rawHotspot,
      walkTo: rawHotspot.walk_to,
      scenery: rawHotspot.kind === "scenery",
    };
  }

  function installDataDrivenCampScene(SceneClass) {
    return class DataDrivenCampScene extends SceneClass {
      preload() {
        const assets = CONTENT_MANIFEST?.assets || {};
        const originalImage = this.load.image.bind(this.load);
        const originalSpritesheet = this.load.spritesheet.bind(this.load);
        this.load.image = (key, url, ...args) => {
          if (key === "campBg" && assets.background) {
            return originalImage(key, versionedScenarioAsset(assets.background), ...args);
          }
          return originalImage(key, url, ...args);
        };
        this.load.spritesheet = (key, url, config, ...args) => {
          if (key === "heroSprite" && assets.hero_spritesheet) {
            return originalSpritesheet(key, versionedScenarioAsset(assets.hero_spritesheet), config, ...args);
          }
          if (key === "heroPortraits" && assets.hero_portraits) {
            return originalSpritesheet(key, versionedScenarioAsset(assets.hero_portraits), config, ...args);
          }
          if (key === "guideSprite" && assets.guide_spritesheet) {
            return originalSpritesheet(key, versionedScenarioAsset(assets.guide_spritesheet), config, ...args);
          }
          return originalSpritesheet(key, url, config, ...args);
        };
        try {
          super.preload();
        } finally {
          this.load.image = originalImage;
          this.load.spritesheet = originalSpritesheet;
        }
        this.load.json(CONTENT_CACHE_KEY, CONTENT_URL);
      }

      create() {
        this.contentModel = this.cache.json.get(CONTENT_CACHE_KEY) || null;
        super.create();
        this.applyDataDrivenSceneConfig();
      }

      applyDataDrivenSceneConfig() {
        const content = this.contentModel;
        if (!content) {
          return;
        }
        if (content.guide?.dialogue_tree) {
          this.guideTree = content.guide.dialogue_tree;
        }
        if (content.guide?.position && this.guide) {
          this.guide.setPosition(content.guide.position.x, content.guide.position.y);
          this.guide.setDepth(Math.round(content.guide.position.y));
          this.guide.setScale(this.getCharacterScale(content.guide.position.y));
          this.guide.zone?.setPosition(content.guide.position.x, content.guide.position.y - 62);
        }
        if (content.hero_start && this.hero) {
          this.hero.setPosition(content.hero_start.x, content.hero_start.y);
          this.hero.setDepth(Math.round(content.hero_start.y));
          this.hero.setScale(this.getCharacterScale(content.hero_start.y));
          this.setHeroIdle("down");
        }
        if (content.hud?.status_text && this.statusText) {
          this.statusText.setText(content.hud.status_text);
        }
      }

      createObjectQuizzes() {
        return this.contentModel?.quizzes || super.createObjectQuizzes();
      }

      setupNavigation() {
        const navigation = this.contentModel?.navigation;
        if (!navigation) {
          super.setupNavigation();
          return;
        }
        this.walkablePoly = navigation.walkable_polygon.map((point) => ({ x: point.x, y: point.y }));
        this.obstacles = navigation.obstacles.map((obstacle) => ({ ...obstacle }));
        this.navClearance = navigation.clearance ?? 30;
      }

      createHotspots() {
        if (!this.contentModel?.hotspots) {
          super.createHotspots();
          return;
        }

        this.hotspots = this.contentModel.hotspots.map(normalizeHotspot);

        this.hotspots.forEach((hotspot) => {
          const marker = this.add.container(hotspot.x, hotspot.y)
            .setDepth(530)
            .setSize(hotspot.radius * 2, hotspot.radius * 2);
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

          const zone = this.add.zone(
            hotspot.x,
            hotspot.y,
            hotspot.radius * 2.4,
            hotspot.radius * 2.4,
          ).setDepth(850).setInteractive({ useHandCursor: true });

          zone.on("pointerover", () => label.setAlpha(1));
          zone.on("pointerout", () => label.setAlpha(0));
          zone.on("pointerdown", () => {
            this.closeBubble();
            this.setCommand(`Look at ${hotspot.label}`);
            const openInteraction = hotspot.scenery
              ? () => this.openSceneryBubble(hotspot)
              : () => this.openObjectIntro(hotspot);
            this.walkHeroTo(hotspot.walkTo.x, hotspot.walkTo.y, openInteraction);
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

        const exit = this.contentModel?.exit_marker;
        this.exitMarker = this.createExitMarker(exit?.x ?? 938, exit?.y ?? 355);
      }

      createExitMarker(x, y) {
        const exit = this.contentModel?.exit_marker;
        if (!exit) {
          return super.createExitMarker(x, y);
        }

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
        const label = this.add.text(0, 42, exit.label, {
          fontFamily: ADVENTURE_FONT,
          fontSize: "14px",
          fontStyle: "700",
          color: "#173837",
          backgroundColor: "rgba(255,251,239,0.93)",
          padding: { x: 7, y: 4 },
        }).setOrigin(0.5);
        marker.add([glow, label]);

        const zone = this.add.zone(x, y, exit.zone?.width ?? 96, exit.zone?.height ?? 118)
          .setDepth(850)
          .setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          this.closeBubble();
          this.setCommand(exit.command || `Walk to ${exit.label}`);
          const walkTo = exit.walk_to || { x, y };
          this.walkHeroTo(walkTo.x, walkTo.y, () => {
            if (!this.flags[exit.required_flag]) {
              this.showSpeechBubble({
                speaker: exit.locked_speaker || "Alex",
                text: exit.locked_text,
                bg: exit.locked_text_bg,
                anchor: { x: this.hero.x + 18, y: this.hero.y - 100 },
                options: [{ text: "OK", action: () => this.closeBubble() }],
              });
              return;
            }
            this.setCommand(exit.unlocked_command || `${exit.label} is open!`);
            this.statusText.setText(exit.unlocked_status || `${exit.label} open`);
            this.flashToast(exit.unlocked_toast || "Next scene would load here.");
          });
        });
        marker.zone = zone;
        return marker;
      }

      onGuideClicked() {
        const guideContent = this.contentModel?.guide;
        if (!guideContent) {
          super.onGuideClicked();
          return;
        }

        this.closeBubble();
        this.setCommand("Talk to guide");
        this.walkHeroTo(guideContent.walk_to.x, guideContent.walk_to.y, () => {
          this.faceHeroToward(this.guide.x, this.guide.y, "normal");
          this.playGuideTalk();
          const hasRequiredItems = guideContent.required_items.every(
            (itemId) => this.learnedWords.includes(itemId),
          );
          if (!hasRequiredItems) {
            this.showSpeechBubble({
              speaker: guideContent.speaker || "Guide",
              text: guideContent.locked_text,
              bg: guideContent.locked_text_bg,
              anchor: { x: this.guide.x, y: this.guide.y - 128 },
              options: [{ text: "OK", action: () => this.closeBubble() }],
            });
            return;
          }
          this.openGuideQuestion(guideContent.dialogue_start_node);
        });
      }

      handleGuideOption(option) {
        if (!this.contentModel) {
          super.handleGuideOption(option);
          return;
        }
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
          this.statusText.setText(
            option.action.status_text
              || this.contentModel.exit_marker?.unlocked_status
              || "Path open",
          );
          if (this.exitMarker?.getAt) {
            this.exitMarker.getAt(0).clear();
            this.exitMarker.getAt(0).fillStyle(0xf4c44e, 1);
            this.exitMarker.getAt(0).fillRoundedRect(-18, -18, 36, 36, 8);
          }
        }
        this.closeBubble();
        this.flashToast(option.action?.toast || this.contentModel.exit_marker?.unlocked_toast || "Path unlocked!");
      }

      getWordTranslation(token) {
        const key = token.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
        return this.contentModel?.translations?.[key] || super.getWordTranslation(token);
      }
    };
  }

  const PhaserGame = Phaser.Game;
  Phaser.Game = class ContentAwarePhaserGame extends PhaserGame {
    constructor(config) {
      const scenes = Array.isArray(config.scene) ? config.scene : [config.scene];
      const dataDrivenScenes = scenes.map((SceneClass) => installDataDrivenCampScene(SceneClass));
      super({ ...config, scene: dataDrivenScenes });
    }
  };

  window.EnglishGameContent = {
    cacheKey: CONTENT_CACHE_KEY,
    url: CONTENT_URL,
  };
})();
