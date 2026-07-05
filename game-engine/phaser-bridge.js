(() => {
  "use strict";

  const root = window;
  const ENGINE_ASSET_VERSION = "20260705-puzzle-eca-1";
  const ADVENTURE_FONT = '"Merienda", "Trebuchet MS", "Georgia", serif';

  function loadJson(url) {
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

  function installEngineScene(SceneClass) {
    return class PuzzleEngineScene extends SceneClass {
      getEngineConfig() {
        if (this.engineConfig !== undefined) {
          return this.engineConfig;
        }
        const sceneId = this.contentModel?.scene_id;
        if (!sceneId?.startsWith("james-bond-")) {
          this.engineConfig = null;
          return null;
        }
        const url = `game-engine/missions/${sceneId}.json?v=${ENGINE_ASSET_VERSION}`;
        this.engineConfig = loadJson(url);
        return this.engineConfig;
      }

      getHotspotPuzzleId(hotspot) {
        return hotspot.puzzle_id || this.getEngineConfig()?.bindings?.hotspots?.[hotspot.id]?.puzzle_id;
      }

      getGuidePuzzleId() {
        return this.contentModel?.guide?.puzzle_id || this.getEngineConfig()?.bindings?.guide?.puzzle_id;
      }

      getExitBinding() {
        return this.getEngineConfig()?.bindings?.exit || {};
      }

      create() {
        super.create();
        this.initializePuzzleEngine();
      }

      initializePuzzleEngine() {
        const config = this.getEngineConfig();
        if (!config || !root.EnglishGameEngine?.create) {
          return;
        }
        const bridge = this.createPuzzleEngineBridge();
        this.gameEngine = root.EnglishGameEngine.create(config, {
          content: this.contentModel,
          bridge,
        });
        root.__ENGLISH_GAME_ENGINE__ = this.gameEngine;
        this.restorePuzzleEngineState(bridge);
        this.gameEngine.emit("scene.started", { target: this.contentModel.scene_id });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.gameEngine?.destroy());
      }

      createPuzzleEngineBridge() {
        return {
          addInventoryItem: (itemId) => {
            if (!this.learnedWords.includes(itemId)) {
              this.learnedWords.push(itemId);
            }
            this.updateInventory();
            const hotspot = this.hotspots?.find((entry) => entry.id === itemId);
            if (hotspot) {
              this.drawHotspotGlow(hotspot, true);
              hotspot.marker?.setAlpha(0.95);
            }
          },
          removeInventoryItem: (itemId) => {
            this.learnedWords = this.learnedWords.filter((entry) => entry !== itemId);
            this.updateInventory();
          },
          clearInventory: () => {
            this.learnedWords = [];
            this.updateInventory();
          },
          setFlag: (flag, value) => {
            this.flags[flag] = value;
          },
          setStatus: (text) => this.statusText?.setText(text),
          showToast: (text) => this.flashToast(text),
          showVocabulary: (hotspotId, alreadyRetrieved) => {
            const hotspot = this.hotspots?.find((entry) => entry.id === hotspotId);
            if (!hotspot) {
              return;
            }
            this.setHeroExpression(hotspot.presentation?.hero_expression || "curious");
            this.showVocabBubble(hotspot, alreadyRetrieved);
          },
          refreshExit: () => this.refreshEngineExitMarker(),
          showDialog: (action) => this.showSpeechBubble({
            speaker: action.speaker || "Alex",
            text: action.text || "That path is not ready yet.",
            bg: action.bg || "Този път още не е готов.",
            anchor: action.anchor || { x: this.hero.x + 18, y: this.hero.y - 100 },
            options: [{ text: "OK", action: () => this.closeBubble() }],
          }),
          transitionScene: (action) => this.transitionToEngineScenario(action),
        };
      }

      restorePuzzleEngineState(bridge) {
        const snapshot = this.gameEngine.getSnapshot().state;
        for (const itemId of snapshot.inventory) {
          bridge.addInventoryItem(itemId);
        }
        const missionPuzzle = this.gameEngine.config.mission_puzzle;
        if (missionPuzzle && this.gameEngine.getPuzzleStatus(missionPuzzle) === "completed") {
          this.validatedSceneIntroTranslations.add(this.getLevelIntroId());
        }
        for (const [name, value] of Object.entries(snapshot.facts)) {
          if (name.startsWith("flag:")) {
            this.flags[name.slice(5)] = value;
          }
        }
        this.refreshEngineExitMarker();
      }

      transitionToEngineScenario(action) {
        if (!action.scenario) {
          return;
        }
        const navigate = () => {
          const url = new URL(root.location.href);
          const test = url.searchParams.get("test");
          const debug = url.searchParams.get("debug");
          url.search = "";
          url.searchParams.set("scenario", action.scenario);
          if (test) url.searchParams.set("test", test);
          if (debug) url.searchParams.set("debug", debug);
          root.location.assign(url.toString());
        };
        if (action.delay_ms) {
          this.time.delayedCall(action.delay_ms, navigate);
        } else {
          navigate();
        }
      }

      refreshEngineExitMarker() {
        const exit = this.contentModel?.exit_marker;
        if (!exit || !this.exitMarker?.engineGlow) {
          return;
        }
        const requiredPuzzle = exit.requires_puzzle || this.getExitBinding().requires_puzzle;
        const unlocked = requiredPuzzle
          ? this.gameEngine?.getPuzzleStatus(requiredPuzzle) === "completed"
          : Boolean(this.flags[exit.required_flag]);
        const glow = this.exitMarker.engineGlow;
        glow.clear();
        glow.fillStyle(unlocked ? 0x42d982 : 0xf4c44e, 0.96);
        glow.fillRoundedRect(-18, -18, 36, 36, 8);
        glow.lineStyle(4, 0xfff7d0, 1);
        glow.beginPath();
        glow.moveTo(-6, -10);
        glow.lineTo(8, 0);
        glow.lineTo(-6, 10);
        glow.strokePath();
      }

      openObjectIntro(hotspot) {
        const puzzleId = this.getHotspotPuzzleId(hotspot);
        if (this.gameEngine && puzzleId && this.gameEngine.getPuzzleStatus(puzzleId) === "locked") {
          this.showSpeechBubble({
            speaker: "Alex",
            text: "I need to understand the mission briefing first.",
            bg: "Първо трябва да разбера брифинга за мисията.",
            anchor: { x: hotspot.x, y: hotspot.y - 40 },
            options: [{ text: "OK", action: () => this.closeBubble() }],
          });
          return;
        }
        super.openObjectIntro(hotspot);
      }

      handleLevelIntroTranslationOption(target, option) {
        super.handleLevelIntroTranslationOption(target, option);
        if (option.isCorrect && this.gameEngine) {
          this.gameEngine.emit("mission.understood", { target: this.contentModel.scene_id });
        }
      }

      retrieveHotspot(hotspot) {
        if (!this.gameEngine) {
          super.retrieveHotspot(hotspot);
          return;
        }
        if (this.learnedWords.includes(hotspot.id)) {
          this.showVocabBubble(hotspot, true);
          return;
        }
        this.gameEngine.emit("collectible.completed", {
          target: hotspot.id,
          hotspot_id: hotspot.id,
          puzzle_id: this.getHotspotPuzzleId(hotspot),
        });
      }

      createExitMarker(x, y) {
        const config = this.getEngineConfig();
        const exit = this.contentModel?.exit_marker;
        if (!config || !exit) {
          return super.createExitMarker(x, y);
        }
        const marker = this.add.container(x, y).setDepth(540).setSize(76, 76);
        const glow = this.add.graphics();
        const label = this.add.text(0, 42, exit.label, {
          fontFamily: ADVENTURE_FONT,
          fontSize: "14px",
          fontStyle: "700",
          color: "#173837",
          backgroundColor: "rgba(255,251,239,0.93)",
          padding: { x: 7, y: 4 },
        }).setOrigin(0.5);
        marker.add([glow, label]);
        marker.engineGlow = glow;
        const zone = this.add.zone(x, y, exit.zone?.width ?? 96, exit.zone?.height ?? 118)
          .setDepth(850)
          .setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          this.closeBubble();
          this.setCommand(exit.command || `Walk to ${exit.label}`);
          const walkTo = exit.walk_to || { x, y };
          this.walkHeroTo(walkTo.x, walkTo.y, () => {
            this.gameEngine.emit("exit.reached", {
              target: exit.id,
              exit_id: exit.id,
              puzzle_id: this.getExitBinding().puzzle_id,
            });
          });
        });
        marker.zone = zone;
        return marker;
      }

      onGuideClicked() {
        const guide = this.contentModel?.guide;
        const guidePuzzle = this.getGuidePuzzleId();
        if (!this.gameEngine || !guide || !guidePuzzle) {
          super.onGuideClicked();
          return;
        }
        this.closeBubble();
        this.setCommand("Talk to guide");
        this.walkHeroTo(guide.walk_to.x, guide.walk_to.y, () => {
          this.faceHeroToward(this.guide.x, this.guide.y, "normal");
          this.playGuideTalk();
          const status = this.gameEngine.getPuzzleStatus(guidePuzzle);
          if (status === "locked") {
            this.showSpeechBubble({
              speaker: guide.speaker || "Guide",
              text: guide.locked_text,
              bg: guide.locked_text_bg,
              anchor: { x: this.guide.x, y: this.guide.y - 128 },
              options: [{ text: "OK", action: () => this.closeBubble() }],
            });
            return;
          }
          if (status === "completed") {
            this.flashToast("Director check already complete.");
            return;
          }
          this.openGuideQuestion(guide.dialogue_start_node);
        });
      }

      handleGuideOption(option) {
        if (!this.gameEngine) {
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
        this.closeBubble();
        this.gameEngine.emit("guide.completed", {
          target: this.getEngineConfig().bindings?.guide?.id || "director",
          puzzle_id: this.getGuidePuzzleId(),
        });
      }
    };
  }

  const PhaserGame = Phaser.Game;
  Phaser.Game = class PuzzleEnginePhaserGame extends PhaserGame {
    constructor(config) {
      const scenes = Array.isArray(config.scene) ? config.scene : [config.scene];
      super({ ...config, scene: scenes.map((SceneClass) => installEngineScene(SceneClass)) });
    }
  };
})();
