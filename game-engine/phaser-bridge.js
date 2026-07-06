(() => {
  "use strict";

  const root = window;
  const ENGINE_ASSET_VERSION = "20260706-level03-art-1";
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

      bridgeValuesEqual(actual, expected) {
        return expected === undefined ? Boolean(actual) : actual === expected;
      }

      bridgeGetPath(source, path) {
        if (!path) {
          return source;
        }
        return String(path).split(".").reduce((value, key) => value?.[key], source);
      }

      bridgeConditionMatches(condition, event = {}) {
        if (!condition) {
          return true;
        }
        if (typeof condition === "boolean") {
          return condition;
        }
        if (Array.isArray(condition)) {
          return condition.every((entry) => this.bridgeConditionMatches(entry, event));
        }
        if (condition.all) {
          return condition.all.every((entry) => this.bridgeConditionMatches(entry, event));
        }
        if (condition.any) {
          return condition.any.some((entry) => this.bridgeConditionMatches(entry, event));
        }
        if (condition.not) {
          return !this.bridgeConditionMatches(condition.not, event);
        }
        const snapshot = this.gameEngine?.getSnapshot().state;
        if (condition.fact) {
          return this.bridgeValuesEqual(snapshot?.facts?.[condition.fact], condition.equals);
        }
        if (condition.inventory_contains) {
          return snapshot?.inventory?.includes(condition.inventory_contains) || false;
        }
        if (condition.inventory_missing) {
          return !(snapshot?.inventory?.includes(condition.inventory_missing));
        }
        if (condition.counter) {
          const actual = snapshot?.counters?.[condition.counter] || 0;
          if (condition.at_least !== undefined) {
            return actual >= condition.at_least;
          }
          if (condition.at_most !== undefined) {
            return actual <= condition.at_most;
          }
          return this.bridgeValuesEqual(actual, condition.equals);
        }
        if (condition.puzzle) {
          return this.gameEngine?.getPuzzleStatus(condition.puzzle) === (condition.status || "completed");
        }
        if (condition.event) {
          return this.bridgeValuesEqual(this.bridgeGetPath(event, condition.event), condition.equals);
        }
        return false;
      }

      getExitRequiredPuzzleForState() {
        const binding = this.getExitBinding();
        for (const state of binding.states || []) {
          if (this.bridgeConditionMatches(state.when)) {
            return state.requires_puzzle;
          }
        }
        return this.contentModel?.exit_marker?.requires_puzzle || binding.requires_puzzle;
      }

      getStateEntry(entries) {
        for (const entry of entries || []) {
          if (this.bridgeConditionMatches(entry.when)) {
            return entry;
          }
        }
        return null;
      }

      getExitPresentationForState() {
        const exit = this.contentModel?.exit_marker || {};
        return { ...exit, ...(this.getStateEntry(exit.states) || {}) };
      }

      getAssistantHint() {
        if (!this.gameEngine) {
          return super.getAssistantHint();
        }
        const snapshot = this.gameEngine.getSnapshot();
        const missionPuzzle = this.gameEngine.config.mission_puzzle;
        const missionNode = missionPuzzle ? this.findAssistantPuzzle(snapshot, missionPuzzle) : null;
        if (missionNode && missionNode.status !== "completed") {
          return this.buildAssistantHint(missionNode.id, snapshot);
        }

        const learningPuzzle = snapshot.available.find((node) =>
          node.type === "learning_puzzle" && this.isAssistantPuzzleVisible(node.id));
        if (learningPuzzle) {
          return this.buildAssistantHint(learningPuzzle.id, snapshot);
        }

        const gate = snapshot.puzzles.find((node) => node.type === "gate" && node.status !== "completed");
        if (gate?.status === "available") {
          return this.buildAssistantHint(gate.id, snapshot);
        }
        const missingGatePuzzle = this.getFirstMissingAssistantPuzzle(gate, snapshot);
        if (missingGatePuzzle) {
          return this.buildAssistantHint(missingGatePuzzle, snapshot);
        }

        const openExit = snapshot.available.find((node) => node.type === "scene_exit");
        if (openExit) {
          return this.buildAssistantHint(openExit.id, snapshot);
        }
        const lockedExit = snapshot.puzzles.find((node) => node.type === "scene_exit" && node.status === "locked");
        const missingExitPuzzle = this.getFirstMissingAssistantPuzzle(lockedExit, snapshot);
        if (missingExitPuzzle) {
          return this.buildAssistantHint(missingExitPuzzle, snapshot);
        }

        const fallback = snapshot.available.find((node) => node.status !== "completed")
          || snapshot.puzzles.find((node) => node.status !== "completed");
        if (fallback) {
          return this.buildAssistantHint(fallback.id, snapshot);
        }

        const assistant = this.contentModel?.assistant || {};
        return {
          speaker: assistant.speaker || "Helper",
          text: assistant.complete_text || "Great work. Explore the scene.",
          bg: assistant.complete_bg || "Чудесна работа. Разгледай сцената.",
        };
      }

      findAssistantPuzzle(snapshot, puzzleId) {
        return snapshot.puzzles.find((node) => node.id === puzzleId) || null;
      }

      getFirstMissingAssistantPuzzle(node, snapshot) {
        if (!node?.missing) {
          return null;
        }
        return this.flattenMissingPuzzleIds(node.missing)
          .find((puzzleId) => this.findAssistantPuzzle(snapshot, puzzleId)?.status !== "completed") || null;
      }

      flattenMissingPuzzleIds(entries) {
        if (!Array.isArray(entries)) {
          return [];
        }
        const ids = [];
        for (const entry of entries) {
          if (entry?.puzzle) {
            ids.push(entry.puzzle);
          }
          if (Array.isArray(entry?.any)) {
            ids.push(...this.flattenMissingPuzzleIds(entry.any));
          }
          if (Array.isArray(entry?.all)) {
            ids.push(...this.flattenMissingPuzzleIds(entry.all));
          }
        }
        return ids;
      }

      isAssistantPuzzleVisible(puzzleId) {
        const hotspot = this.getAssistantHotspotForPuzzle(puzzleId);
        return !hotspot || this.isHotspotVisibleForState(hotspot);
      }

      getAssistantHotspotForPuzzle(puzzleId) {
        const hotspotBindings = this.getEngineConfig()?.bindings?.hotspots || {};
        const hotspotId = Object.entries(hotspotBindings)
          .find(([_id, binding]) => binding?.puzzle_id === puzzleId)?.[0];
        return this.hotspots?.find((hotspot) => hotspot.id === hotspotId) || null;
      }

      buildAssistantHint(puzzleId, snapshot) {
        const assistant = this.contentModel?.assistant || {};
        const configured = assistant.hints?.[puzzleId];
        if (configured?.text && configured?.bg) {
          return {
            speaker: assistant.speaker || configured.speaker || "Helper",
            text: configured.text,
            bg: configured.bg,
          };
        }
        const text = this.getAssistantFallbackText(puzzleId, snapshot);
        return {
          speaker: assistant.speaker || "Helper",
          text,
          bg: assistant.fallback_bg || "Провери следващата задача.",
        };
      }

      getAssistantFallbackText(puzzleId, snapshot) {
        const missionPuzzle = this.gameEngine?.config?.mission_puzzle;
        if (puzzleId === missionPuzzle) {
          const planId = this.contentModel?.level_plan?.plan_hotspot_id;
          const planHotspot = this.hotspots?.find((hotspot) => hotspot.id === planId);
          return `Read the ${planHotspot?.label || "mission plan"} first.`;
        }
        const hotspot = this.getAssistantHotspotForPuzzle(puzzleId);
        if (hotspot) {
          return `Go to the ${hotspot.label}.`;
        }
        if (puzzleId === this.getGuidePuzzleId()) {
          return `Talk to ${this.contentModel?.guide?.speaker || "the guide"}.`;
        }
        const exitNode = this.findAssistantPuzzle(snapshot, puzzleId);
        if (exitNode?.type === "scene_exit") {
          return `Use the ${this.getExitPresentationForState().label || "exit"}.`;
        }
        return this.findAssistantPuzzle(snapshot, puzzleId)?.title || "Check the next mission step.";
      }

      isHotspotVisibleForState(hotspot) {
        if (hotspot.visible_when && !this.bridgeConditionMatches(hotspot.visible_when)) {
          return false;
        }
        if (hotspot.hidden_when && this.bridgeConditionMatches(hotspot.hidden_when)) {
          return false;
        }
        return true;
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
        this.resetPuzzleEngineStorageForDev(config);
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

      resetPuzzleEngineStorageForDev(config) {
        const params = new URLSearchParams(root.location?.search || "");
        if (!["1", "true", "yes"].includes((params.get("reset") || "").toLowerCase())) {
          return;
        }
        try {
          root.sessionStorage?.removeItem(config.storage_key);
        } catch (_error) {
          // If storage is unavailable, the runtime will fall back to memory storage.
        }
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
          refreshHotspots: () => this.refreshEngineHotspots(),
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
        this.applyEngineStatePrompt();
        this.refreshEngineHotspots();
        this.refreshEngineExitMarker();
      }

      applyEngineStatePrompt() {
        const prompt = this.getStateEntry(this.contentModel?.state_prompts);
        if (!prompt) {
          return;
        }
        if (prompt.status_text) {
          this.statusText?.setText(prompt.status_text);
        }
        if (prompt.command_text) {
          this.setCommand(prompt.command_text);
        }
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
        const presentation = this.getExitPresentationForState();
        if (this.exitMarker.label && presentation.label) {
          this.exitMarker.label.setText(presentation.label);
        }
        const requiredPuzzle = this.getExitRequiredPuzzleForState();
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

      refreshEngineHotspots() {
        for (const hotspot of this.hotspots || []) {
          const visible = this.isHotspotVisibleForState(hotspot);
          hotspot.marker?.setVisible(visible);
          hotspot.zone?.setVisible(visible);
          if (visible) {
            hotspot.zone?.setInteractive?.({ useHandCursor: true });
          } else {
            hotspot.zone?.disableInteractive?.();
          }
        }
      }

      openObjectIntro(hotspot) {
        const puzzleId = this.getHotspotPuzzleId(hotspot);
        if (this.gameEngine && puzzleId && this.gameEngine.getPuzzleStatus(puzzleId) === "locked") {
          this.showSpeechBubble({
            speaker: "Alex",
            text: hotspot.locked_text || "I need to understand the mission briefing first.",
            bg: hotspot.locked_text_bg || "Първо трябва да разбера брифинга за мисията.",
            anchor: { x: hotspot.x, y: hotspot.y - 40 },
            options: [{ text: "OK", action: () => this.closeBubble() }],
          });
          return;
        }
        super.openObjectIntro(hotspot);
      }

      openSceneryBubble(hotspot) {
        const missionPuzzle = this.gameEngine?.config?.mission_puzzle;
        const planHotspotId = this.contentModel?.level_plan?.plan_hotspot_id;
        if (
          this.gameEngine
          && missionPuzzle
          && hotspot.id === planHotspotId
          && this.gameEngine.getPuzzleStatus(missionPuzzle) !== "completed"
        ) {
          this.openLevelIntro();
          return;
        }
        super.openSceneryBubble(hotspot);
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
        const presentation = this.getExitPresentationForState();
        const sceneIcon = this.createHotspotSceneIcon?.({
          id: exit.id || "exit",
          radius: 42,
          scene_icon: presentation.scene_icon || exit.scene_icon,
        });
        const label = this.add.text(0, 42, presentation.label || exit.label, {
          fontFamily: ADVENTURE_FONT,
          fontSize: "14px",
          fontStyle: "700",
          color: "#173837",
          backgroundColor: "rgba(255,251,239,0.93)",
          padding: { x: 7, y: 4 },
        }).setOrigin(0.5);
        marker.add(sceneIcon ? [glow, sceneIcon, label] : [glow, label]);
        marker.engineGlow = glow;
        marker.label = label;
        marker.sceneIcon = sceneIcon;
        const zone = this.add.zone(x, y, exit.zone?.width ?? 96, exit.zone?.height ?? 118)
          .setDepth(850)
          .setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          this.closeBubble();
          const currentExit = this.getExitPresentationForState();
          this.setCommand(currentExit.command || `Walk to ${currentExit.label || exit.label}`);
          const walkTo = currentExit.walk_to || exit.walk_to || { x, y };
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
            const message = this.getStateEntry(guide.completed_messages);
            if (message?.text) {
              this.showSpeechBubble({
                speaker: guide.speaker || "Guide",
                text: message.text,
                bg: message.bg || guide.locked_text_bg,
                anchor: { x: this.guide.x, y: this.guide.y - 128 },
                options: [{ text: "OK", action: () => this.closeBubble() }],
              });
              return;
            }
            this.flashToast(guide.completed_toast || `${guide.speaker || "Guide"} check already complete.`);
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
