(() => {
  "use strict";

  const CONTENT_CACHE_KEY = "campContent";
  const CONTENT_URL = "scenarios/camp-content.json?v=20260705-data-content-1";
  const ADVENTURE_FONT = '"Merienda", "Trebuchet MS", "Georgia", serif';

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
        super.preload();
        this.load.json(CONTENT_CACHE_KEY, CONTENT_URL);
      }

      create() {
        this.contentModel = this.cache.json.get(CONTENT_CACHE_KEY) || null;
        super.create();
      }

      createObjectQuizzes() {
        return this.contentModel?.quizzes || super.createObjectQuizzes();
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

        this.exitMarker = this.createExitMarker(938, 355);
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
              speaker: "Guide",
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
