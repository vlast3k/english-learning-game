(() => {
  "use strict";

  const root = window;
  const ENGINE_ASSET_VERSION = "20260710-save-resume-fix";
  const BRIDGE_GAME_WIDTH = 1024;
  const BRIEFING_BUTTON_WIDTH = 150;
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

  function normalizeManifestPath(path) {
    const value = String(path || "").trim();
    if (!value || value.includes("://") || value.startsWith("/") || value.includes("..")) {
      return null;
    }
    return value;
  }

  function installEngineScene(SceneClass) {
    return class PuzzleEngineScene extends SceneClass {
      getEngineManifestUrl() {
        if (this.contentModel?.engine_manifest === null || this.contentModel?.engine_manifest === false) {
          return null;
        }
        const configuredPath = normalizeManifestPath(this.contentModel?.engine_manifest);
        if (configuredPath) {
          return `${configuredPath}?v=${ENGINE_ASSET_VERSION}`;
        }
        const sceneId = String(this.contentModel?.scene_id || "").trim();
        if (!sceneId) {
          return null;
        }
        return `game-engine/missions/${sceneId}.json?v=${ENGINE_ASSET_VERSION}`;
      }

      getEngineConfig() {
        if (this.engineConfig !== undefined) {
          return this.engineConfig;
        }
        const url = this.getEngineManifestUrl();
        if (!url) {
          this.engineConfig = null;
          return null;
        }
        this.engineConfig = loadJson(url);
        return this.engineConfig;
      }

      getHotspotPuzzleId(hotspot) {
        return hotspot.puzzle_id || this.getEngineConfig()?.bindings?.hotspots?.[hotspot.id]?.puzzle_id;
      }

      getGuidePuzzleId() {
        const primaryNpc = this.getPrimaryNpcContent?.() || this.contentModel?.guide;
        return primaryNpc?.puzzle_id || this.getEngineConfig()?.bindings?.guide?.puzzle_id;
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
        if (condition === undefined || condition === null) {
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

      isAdventureMode() {
        return this.contentModel?.gameplay_mode === "adventure";
      }

      isExplorationMode() {
        const params = new URLSearchParams(root.location?.search || "");
        return ["1", "true", "yes"].includes((params.get("explore") || "").toLowerCase());
      }

      getExplorationDestination(eventType, target) {
        const rule = (this.getEngineConfig()?.rules || []).find((entry) => (
          entry.event?.type === eventType
          && entry.event?.target === target
          && entry.actions?.some((action) => action.type === "scene.transition" && action.scenario)
        ));
        return rule?.actions?.find((action) => action.type === "scene.transition" && action.scenario)?.scenario || null;
      }

      tryExplorationTransition(eventType, target, event = {}) {
        if (!this.isExplorationMode()) {
          return false;
        }
        const scenario = this.getExplorationDestination(eventType, target);
        if (!scenario) {
          return false;
        }
        this.transitionToEngineScenario({ scenario }, { ...event, type: eventType, target });
        return true;
      }

      getEngineFacts() {
        return this.gameEngine?.getSnapshot().state?.facts || {};
      }

      getEngineInventory() {
        return this.gameEngine?.getSnapshot().state?.inventory || [];
      }

      getInventoryMaxSlots() {
        if (!this.isAdventureMode()) {
          return null;
        }
        return this.contentModel?.inventory?.max_slots || 6;
      }

      getInventorySlotIds() {
        if (!this.isAdventureMode()) {
          return super.getInventorySlotIds();
        }
        return this.getEngineInventory();
      }

      getInventoryItemPresentation(itemId) {
        if (!this.isAdventureMode()) {
          return null;
        }
        const configured = this.contentModel?.inventory_items?.[itemId];
        const manifestIcon = this.getAssetFrameManifest()?.inventory_icons?.[itemId] || null;
        if (!configured && !manifestIcon) {
          return null;
        }
        const fallbackLabel = itemId
          .replace(/_\d+$/g, "")
          .replace(/_/g, " ")
          .replace(/\bgreen lens\b/i, "Green Lens");
        const icon = configured?.icon || manifestIcon;
        return {
          id: itemId,
          label: configured?.label || fallbackLabel,
          english: configured?.english || configured?.label || fallbackLabel,
          bg: configured?.bg || "",
          x: configured?.x || 140,
          y: configured?.y || 126,
          radius: configured?.radius || 30,
          intro: configured?.intro || {
            text: configured?.text || `This is ${configured?.label || fallbackLabel}.`,
            bg: configured?.text_bg || configured?.bg || "",
          },
          inventory: configured?.inventory || { icon },
          icon,
        };
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

      getActiveExitPuzzle() {
        if (!this.gameEngine) {
          return null;
        }
        const snapshot = this.gameEngine.getSnapshot();
        return snapshot.available.find((node) => node.type === "scene_exit")
          || snapshot.puzzles.find((node) => node.type === "scene_exit" && node.status === "available")
          || null;
      }

      shouldRunExitVocabularyGate() {
        const exitPuzzle = this.getActiveExitPuzzle();
        return Boolean(exitPuzzle && exitPuzzle.status !== "completed");
      }

      getGateVocabularyPool() {
        const configuredWords = this.contentModel?.level_plan?.gate_review_words
          || this.contentModel?.level_plan?.vocabulary_targets
          || [];
        const translations = this.contentModel?.translations || {};
        return configuredWords
          .map((word) => {
            const english = String(word || "").trim();
            const bulgarian = translations[english.toLowerCase()] || translations[english] || null;
            return english && bulgarian ? { english, bulgarian } : null;
          })
          .filter(Boolean);
      }

      chooseGateReviewWords(pool, count) {
        const shuffled = [...pool];
        Phaser.Utils.Array.Shuffle(shuffled);
        if (shuffled.length >= count) {
          return shuffled.slice(0, count);
        }
        const result = [...shuffled];
        while (result.length < count && pool.length > 0) {
          const next = pool[result.length % pool.length];
          result.push(next);
        }
        return result;
      }

      buildGateQuestionOptions(word, pool, direction) {
        const distractorPool = pool.filter((entry) => entry.english !== word.english);
        Phaser.Utils.Array.Shuffle(distractorPool);
        const optionText = direction === "en-bg" ? "bulgarian" : "english";
        const correct = {
          text: word[optionText],
          isCorrect: true,
        };
        const feedback = `Not yet. ${word.english} = ${word.bulgarian}. Try again.`;
        const distractors = distractorPool.slice(0, 2).map((entry) => ({
          text: entry[optionText],
          feedback,
        }));
        return this.getShuffledChallengeOptions([correct, ...distractors]);
      }

      buildGateReviewQuestions() {
        const pool = this.getGateVocabularyPool();
        const reviewWords = this.chooseGateReviewWords(pool, 10);
        return reviewWords.map((word, index) => {
          const direction = index % 2 === 0 ? "en-bg" : "bg-en";
          const promptWord = direction === "en-bg" ? word.english : word.bulgarian;
          const text = direction === "en-bg"
            ? `Gate review ${index + 1}/10. Decode the field word "${promptWord}". Tap its Bulgarian code word.`
            : `Gate review ${index + 1}/10. The clue says "${promptWord}". Tap its English code word.`;
          return {
            id: `exit-gate-review-${index + 1}`,
            text,
            word,
            direction,
          };
        });
      }

      openExitVocabularyGate(onPassed, questionIndex = null, questions = null) {
        const gateQuestions = questions || this.exitGateReview?.questions || this.buildGateReviewQuestions();
        const currentIndex = questionIndex ?? this.exitGateReview?.questionIndex ?? 0;
        this.exitGateReview = { questions: gateQuestions, questionIndex: currentIndex };
        const question = gateQuestions[currentIndex];
        if (!question) {
          this.exitGateReview = null;
          this.closeBubble();
          onPassed();
          return;
        }
        const pool = this.getGateVocabularyPool();
        this.showSpeechBubble({
          speaker: "Gate Review",
          text: question.text,
          bg: "",
          anchor: { x: this.exitMarker.x, y: this.exitMarker.y - 54 },
          revealTranslations: false,
          onClose: () => {
            this.closeBubble();
            this.setCommand("Gate review paused");
          },
          options: this.buildGateQuestionOptions(question.word, pool, question.direction).map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect,
            action: () => this.handleExitVocabularyGateOption(option, onPassed, currentIndex, gateQuestions),
          })),
        });
      }

      handleExitVocabularyGateOption(option, onPassed, questionIndex, questions) {
        if (!option.isCorrect) {
          this.activeBubble?.showFeedback(option.feedback || "Try that word once more before the gate opens.");
          return;
        }
        this.exitGateReview = { questions, questionIndex: questionIndex + 1 };
        this.closeBubble();
        this.time.delayedCall(100, () => this.openExitVocabularyGate(onPassed, questionIndex + 1, questions));
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
          return `Read the ${planHotspot?.label || this.contentModel?.level_plan?.title || "plan"} first.`;
        }
        const hotspot = this.getAssistantHotspotForPuzzle(puzzleId);
        if (hotspot) {
          return `Go to the ${hotspot.label}.`;
        }
        if (puzzleId === this.getGuidePuzzleId()) {
          const primaryNpc = this.getPrimaryNpcContent?.() || this.contentModel?.guide;
          return `Talk to ${primaryNpc?.speaker || primaryNpc?.label || "the helper"}.`;
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
        if (this.isAdventureMode()) {
          this.createAdventureOverlays();
          this.createAdventureMapButton();
          this.refreshAdventureScreenState();
          this.gameEngine?.emit("scene.entered", {
            target: this.contentModel.scene_id,
            screen: this.contentModel.scene_id,
          });
        }
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
        this.gameEngine.setResumeLocation({
          scenario: this.getCurrentScenarioPath(),
          sceneId: this.contentModel.scene_id,
        });
        root.__ENGLISH_GAME_ENGINE__ = this.gameEngine;
        this.restorePuzzleEngineState(bridge);
        this.createMissionBriefingButton();
        this.refreshMissionBriefingButton();
        this.unsubscribeMissionBriefingButton = this.gameEngine.state?.subscribe?.(() => {
          this.refreshMissionBriefingButton();
        });
        this.gameEngine.emit("scene.started", { target: this.contentModel.scene_id });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
          this.unsubscribeMissionBriefingButton?.();
          this.gameEngine?.destroy();
        });
      }

      getCurrentScenarioPath() {
        const contentUrl = String(root.EnglishGameContent?.url || "").split(/[?#]/, 1)[0].replace(/^\/+/, "");
        const scenarioOffset = contentUrl.indexOf("scenarios/");
        return scenarioOffset >= 0 ? contentUrl.slice(scenarioOffset) : contentUrl;
      }

      createMissionBriefingButton() {
        if (this.missionBriefingButton || !this.getLevelIntroPlan()?.mission) {
          return;
        }
        const x = BRIDGE_GAME_WIDTH - 190;
        const y = 98;
        const button = this.add.container(x, y).setDepth(905).setSize(BRIEFING_BUTTON_WIDTH, 48);
        const bg = this.add.graphics();
        const icon = this.add.graphics();
        const label = this.add.text(8, 0, "BRIEF", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "14px",
          fontStyle: "700",
          color: "#173837",
        }).setOrigin(0, 0.5);
        const hitPlate = this.add.zone(0, 0, BRIEFING_BUTTON_WIDTH + 8, 54).setInteractive({ useHandCursor: true });
        button.add([bg, icon, label, hitPlate]);
        button.bg = bg;
        button.icon = icon;
        button.label = label;
        button.hitPlate = hitPlate;
        button.drawState = "idle";
        const redraw = (state = "idle") => {
          button.drawState = state;
          this.drawMissionBriefingButton(state);
        };
        hitPlate.on("pointerover", () => {
          redraw("hover");
          this.setCommand("Read mission briefing");
        });
        hitPlate.on("pointerout", () => redraw("idle"));
        hitPlate.on("pointerdown", () => {
          redraw("down");
          this.openMissionBriefingFromHud();
        });
        hitPlate.on("pointerup", () => redraw("hover"));
        this.missionBriefingButton = button;
      }

      isMissionBriefingComplete() {
        const missionPuzzle = this.gameEngine?.config?.mission_puzzle;
        return Boolean(missionPuzzle && this.gameEngine.getPuzzleStatus(missionPuzzle) === "completed");
      }

      drawMissionBriefingButton(state = "idle") {
        const button = this.missionBriefingButton;
        if (!button) {
          return;
        }
        const complete = this.isMissionBriefingComplete();
        const hover = state === "hover";
        const down = state === "down";
        const fill = complete ? 0x42d982 : 0xf4c44e;
        const edge = complete ? 0x0f7a4c : 0x9b7343;
        const halfWidth = BRIEFING_BUTTON_WIDTH / 2;
        button.bg.clear();
        button.bg.fillStyle(0x0b1d18, down ? 0.34 : 0.24);
        button.bg.fillRoundedRect(-halfWidth + 3, -20, BRIEFING_BUTTON_WIDTH, 44, 9);
        button.bg.fillStyle(fill, down ? 0.84 : 0.96);
        button.bg.lineStyle(3, hover || down ? 0xfff7d0 : edge, hover || down ? 1 : 0.88);
        button.bg.fillRoundedRect(-halfWidth, -24, BRIEFING_BUTTON_WIDTH, 44, 9);
        button.bg.strokeRoundedRect(-halfWidth, -24, BRIEFING_BUTTON_WIDTH, 44, 9);
        button.bg.fillStyle(0xfffbef, complete ? 0.24 : 0.32);
        button.bg.fillRoundedRect(-halfWidth + 7, -17, BRIEFING_BUTTON_WIDTH - 14, 12, 6);

        button.icon.clear();
        button.icon.fillStyle(0xfffbef, 0.92);
        button.icon.lineStyle(2, 0x173837, 0.74);
        button.icon.fillRoundedRect(-58, -12, 28, 24, 5);
        button.icon.strokeRoundedRect(-58, -12, 28, 24, 5);
        button.icon.lineStyle(1, 0x173837, 0.55);
        button.icon.beginPath();
        button.icon.moveTo(-52, -4);
        button.icon.lineTo(-36, -4);
        button.icon.moveTo(-52, 3);
        button.icon.lineTo(-39, 3);
        button.icon.strokePath();
        if (complete) {
          button.icon.lineStyle(3, 0x0f7a4c, 1);
          button.icon.beginPath();
          button.icon.moveTo(-51, 12);
          button.icon.lineTo(-45, 18);
          button.icon.lineTo(-33, 6);
          button.icon.strokePath();
        }
        button.label.setColor(complete ? "#073b26" : "#4f351c");
      }

      refreshMissionBriefingButton() {
        if (!this.missionBriefingButton) {
          return;
        }
        if (this.isMissionBriefingComplete()) {
          this.validatedSceneIntroTranslations.add(this.getLevelIntroId());
        }
        this.drawMissionBriefingButton(this.missionBriefingButton.drawState || "idle");
      }

      openMissionBriefingFromHud() {
        this.closeBubble();
        this.setCommand("Read mission briefing");
        if (this.isMissionBriefingComplete()) {
          this.validatedSceneIntroTranslations.add(this.getLevelIntroId());
        }
        this.openLevelIntro(true);
      }

      resetPuzzleEngineStorageForDev(config) {
        const params = new URLSearchParams(root.location?.search || "");
        if (!["1", "true", "yes"].includes((params.get("reset") || "").toLowerCase())) {
          return;
        }
        try {
          root.localStorage?.removeItem(config.storage_key);
          const latest = JSON.parse(root.localStorage?.getItem("english-game:last-campaign") || "null");
          if (latest?.storageKey === config.storage_key) {
            root.localStorage?.removeItem("english-game:last-campaign");
          }
          // Clear the former session-only save too, so a reset stays complete
          // for people returning from an older build.
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
              hotspot.marker?.setAlpha(this.levelEditorEnabled ? 1 : 0.24);
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
          clearInventorySelection: () => this.clearAdventureInventorySelection(),
          setFlag: (flag, value) => {
            this.flags[flag] = value;
          },
          setStatus: (text) => this.statusText?.setText(text),
          showToast: (text) => this.flashToast(text),
          openMap: () => this.openAdventureMapPanel(),
          refreshMap: () => this.refreshAdventureMapButton(),
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
          refreshScreenState: () => this.refreshAdventureScreenState(),
          showDialog: (action) => this.showSpeechBubble({
            speaker: action.speaker || this.contentModel?.player?.speaker || this.contentModel?.hero?.speaker || "Hero",
            text: action.text || "That path is not ready yet.",
            bg: action.bg || "Този път още не е готов.",
            anchor: action.anchor || { x: this.hero.x + 18, y: this.hero.y - 100 },
            options: [{ text: "OK", action: () => this.closeBubble() }],
          }),
          transitionScene: (action, event) => this.transitionToEngineScenario(action, event),
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

      getAssetFrameManifest() {
        if (this.assetFrameManifest !== undefined) {
          return this.assetFrameManifest;
        }
        const manifests = [this.cache.json.get("assetFrames")]
          .concat((this.contentModel?.assets?.extra_asset_frames || [])
            .map((_path, index) => this.cache.json.get(`assetFramesExtra${index}`)))
          .filter(Boolean);
        if (manifests.length === 0) {
          this.assetFrameManifest = null;
          return this.assetFrameManifest;
        }
        this.assetFrameManifest = manifests.reduce((merged, manifest) => ({
          ...merged,
          ...manifest,
          textures: { ...(merged.textures || {}), ...(manifest.textures || {}) },
          inventory_icons: { ...(merged.inventory_icons || {}), ...(manifest.inventory_icons || {}) },
          recommended_overlays: { ...(merged.recommended_overlays || {}), ...(manifest.recommended_overlays || {}) },
        }), {});
        return this.assetFrameManifest;
      }

      ensureAdventureTextureFrame(textureKey, frameName) {
        const texture = this.textures.get(textureKey);
        if (!texture || !frameName) {
          return null;
        }
        if (texture.has(frameName)) {
          return frameName;
        }
        const frame = this.getAssetFrameManifest()?.textures?.[textureKey]?.frames?.[frameName];
        if (!frame) {
          return null;
        }
        const source = texture.getSourceImage();
        const x = Math.round(Phaser.Math.Clamp(frame.x, 0, source.width));
        const y = Math.round(Phaser.Math.Clamp(frame.y, 0, source.height));
        const width = Math.round(Phaser.Math.Clamp(frame.width, 1, source.width - x));
        const height = Math.round(Phaser.Math.Clamp(frame.height, 1, source.height - y));
        texture.add(frameName, 0, x, y, width, height);
        return frameName;
      }

      createAdventureOverlays() {
        if (!this.isAdventureMode() || this.adventureOverlays) {
          return;
        }
        this.adventureOverlays = [];
        for (const spec of this.contentModel?.overlays || []) {
          if (spec.kind === "water_path") {
            const points = Array.isArray(spec.points) ? spec.points : [];
            if (points.length < 2) {
              continue;
            }
            const water = this.add.graphics().setDepth(spec.depth ?? 415);
            const drawPath = (width, color, alpha) => {
              water.lineStyle(width, color, alpha);
              water.beginPath();
              water.moveTo(points[0].x, points[0].y);
              for (const point of points.slice(1)) {
                water.lineTo(point.x, point.y);
              }
              water.strokePath();
            };
            drawPath(spec.bank_width ?? 20, spec.bank_color ?? 0x2b83a0, 0.82);
            drawPath(spec.water_width ?? 13, spec.water_color ?? 0x38c7e9, 0.96);
            drawPath(spec.highlight_width ?? 3, spec.highlight_color ?? 0xe7fbff, 0.56);
            this.adventureOverlays.push({ spec, image: water });
            continue;
          }
          const frameName = this.ensureAdventureTextureFrame(spec.texture, spec.frame);
          if (!frameName && !this.textures.exists(spec.texture)) {
            continue;
          }
          const image = this.add.image(spec.x, spec.y, spec.texture, frameName || undefined)
            .setOrigin(spec.origin?.x ?? 0.5, spec.origin?.y ?? 0.5)
            .setDepth(spec.depth ?? Math.round(spec.y || 500));
          if (Number.isFinite(spec.scale)) {
            image.setScale(spec.scale);
          }
          if (Number.isFinite(spec.angle)) {
            image.setAngle(spec.angle);
          }
          if (Number.isFinite(spec.display_width) || Number.isFinite(spec.display_height)) {
            image.setDisplaySize(spec.display_width || image.displayWidth, spec.display_height || image.displayHeight);
          }
          this.adventureOverlays.push({ spec, image });
        }
      }

      refreshAdventureOverlays() {
        for (const overlay of this.adventureOverlays || []) {
          overlay.image.setVisible(this.bridgeConditionMatches(overlay.spec.visible_when));
        }
      }

      applyAdventureStaticGuideArt() {
        const spec = this.getPrimaryNpcContent?.()?.static_image;
        if (!this.isAdventureMode() || !spec || !this.guide || this.guide.staticImage) {
          return;
        }
        const frameName = this.ensureAdventureTextureFrame(spec.texture, spec.frame);
        const image = this.add.image(0, 0, spec.texture, frameName || undefined)
          .setOrigin(spec.origin?.x ?? 0.5, spec.origin?.y ?? 1)
          .setScale(spec.scale ?? 0.34);
        this.guide.sprite?.setVisible(false);
        this.guide.staticImage = image;
        this.guide.add(image);
      }

      createInventorySlot(hotspot, index) {
        const slot = super.createInventorySlot(hotspot, index);
        if (!this.isAdventureMode()) {
          return slot;
        }
        if (this.selectedInventoryItemId === hotspot.id) {
          const ring = this.add.graphics();
          ring.lineStyle(4, 0x42d982, 1);
          ring.strokeRoundedRect(-25, -25, 50, 50, 10);
          ring.lineStyle(2, 0xfffbef, 0.9);
          ring.strokeRoundedRect(-19, -19, 38, 38, 7);
          slot.addAt(ring, 0);
          slot.selectedRing = ring;
        }
        return slot;
      }

      handleInventorySlotPointerDown(_slot, hotspot) {
        if (!this.isAdventureMode() || !this.gameEngine) {
          return false;
        }
        const itemId = hotspot.id;
        if (!this.getEngineInventory().includes(itemId)) {
          return false;
        }
        if (this.selectedInventoryItemId && this.selectedInventoryItemId !== itemId) {
          const items = [this.selectedInventoryItemId, itemId].sort();
          const result = this.gameEngine.emit("inventory.items_combined", {
            target: items.join("+"),
            items,
            primary: this.selectedInventoryItemId,
            secondary: itemId,
          });
          if (result.firedRules.length === 0) {
            this.flashToast("These do not fit together.");
          }
          this.clearAdventureInventorySelection();
          return true;
        }
        if (this.selectedInventoryItemId === itemId) {
          this.clearAdventureInventorySelection();
          this.openInventoryDetail(hotspot);
          return true;
        }
        this.selectedInventoryItemId = itemId;
        this.setCommand(`Use ${hotspot.label || itemId} with...`);
        this.gameEngine.emit("inventory.item_selected", { target: itemId, item: itemId });
        this.updateInventory();
        return true;
      }

      clearAdventureInventorySelection() {
        if (!this.selectedInventoryItemId) {
          return;
        }
        this.selectedInventoryItemId = null;
        this.setCommand("Walk to...");
        this.updateInventory();
      }

      getAdventureMapConfig() {
        return this.contentModel?.map || null;
      }

      createAdventureMapButton() {
        if (!this.isAdventureMode() || this.adventureMapButton || !this.getAdventureMapConfig()) {
          return;
        }
        const button = this.add.container(872, 92).setDepth(907).setSize(58, 58);
        const bg = this.add.graphics();
        const icon = this.add.graphics();
        const hitPlate = this.add.zone(0, 0, 64, 64).setInteractive({ useHandCursor: true });
        button.add([bg, icon, hitPlate]);
        button.bg = bg;
        button.icon = icon;
        button.hitPlate = hitPlate;
        hitPlate.on("pointerover", () => this.drawAdventureMapButton("hover"));
        hitPlate.on("pointerout", () => this.drawAdventureMapButton("idle"));
        hitPlate.on("pointerdown", () => {
          this.drawAdventureMapButton("down");
          if (button.enabled && !this.activeBubble) {
            this.openAdventureMapPanel();
          } else if (!button.enabled) {
            this.flashToast("Find the map first.");
          }
        });
        hitPlate.on("pointerup", () => this.drawAdventureMapButton("hover"));
        this.adventureMapButton = button;
        this.refreshAdventureMapButton();
      }

      isAdventureMapEnabled() {
        if (this.isExplorationMode()) {
          return true;
        }
        const config = this.getAdventureMapConfig();
        return this.bridgeConditionMatches(config?.button?.enabled_when);
      }

      drawAdventureMapButton(state = "idle") {
        const button = this.adventureMapButton;
        if (!button) {
          return;
        }
        button.drawState = state;
        const enabled = this.isAdventureMapEnabled();
        button.enabled = enabled;
        const hover = state === "hover";
        const down = state === "down";
        const fill = enabled ? 0xf4c44e : 0xb8aa89;
        const edge = enabled ? 0x8b6336 : 0x6f6a5c;
        button.bg.clear();
        button.bg.fillStyle(0x2c1c13, down ? 0.32 : 0.22);
        button.bg.fillCircle(3, 4, 31);
        button.bg.fillStyle(fill, enabled ? 0.98 : 0.64);
        button.bg.lineStyle(3, hover && enabled ? 0xfffbef : edge, enabled ? 0.95 : 0.55);
        button.bg.fillCircle(0, 0, 29);
        button.bg.strokeCircle(0, 0, 29);
        button.icon.clear();
        button.icon.lineStyle(3, enabled ? 0x173837 : 0x5c5a52, enabled ? 0.92 : 0.65);
        button.icon.strokeRoundedRect(-14, -11, 28, 22, 3);
        button.icon.beginPath();
        button.icon.moveTo(-5, -10);
        button.icon.lineTo(-8, 11);
        button.icon.moveTo(5, -10);
        button.icon.lineTo(8, 11);
        button.icon.strokePath();
        button.icon.fillStyle(enabled ? 0x0f7a78 : 0x6f6a5c, enabled ? 0.92 : 0.55);
        button.icon.fillCircle(8, -4, 3);
      }

      refreshAdventureMapButton() {
        this.drawAdventureMapButton(this.adventureMapButton?.drawState || "idle");
      }

      openAdventureMapPanel() {
        if (!this.isAdventureMode() || !this.gameEngine || !this.getAdventureMapConfig()) {
          return;
        }
        this.closeBubble();
        this.closeAdventureMapPanel();
        const panel = this.add.container(152, 84).setDepth(980);
        const bg = this.add.graphics();
        const width = 720;
        const height = 418;
        this.drawDialoguePanel(bg, width, height);
        const title = this.add.text(34, 26, "Map", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "28px",
          fontStyle: "700",
          color: "#123937",
        });
        const closeButton = this.makeCloseButton(width - 50, 22, () => this.closeAdventureMapPanel());
        panel.add([bg, title, closeButton]);
        const markers = (this.getAdventureMapConfig().markers || [])
          .filter((marker) => this.isExplorationMode() || this.bridgeConditionMatches(marker.visible_when));
        markers.forEach((marker, index) => {
          const x = marker.x !== undefined ? marker.x + width / 2 : 98 + (index % 3) * 220;
          const y = marker.y !== undefined ? marker.y + height / 2 : 124 + Math.floor(index / 3) * 112;
          panel.add(this.createAdventureMapMarker(marker, x, y));
        });
        this.adventureMapPanel = panel;
      }

      createAdventureMapMarker(marker, x, y) {
        const enabled = this.isExplorationMode() || this.bridgeConditionMatches(marker.enabled_when);
        const container = this.add.container(x, y).setSize(188, 72);
        const bg = this.add.graphics();
        bg.fillStyle(enabled ? 0xffedbd : 0xd7ccb2, enabled ? 0.98 : 0.64);
        bg.lineStyle(3, enabled ? 0x9b7343 : 0x7d7668, enabled ? 0.92 : 0.54);
        bg.fillRoundedRect(-88, -32, 176, 64, 8);
        bg.strokeRoundedRect(-88, -32, 176, 64, 8);
        bg.fillStyle(enabled ? 0x0f7a78 : 0x6f6a5c, enabled ? 0.95 : 0.6);
        bg.fillCircle(-58, 0, 14);
        const label = this.add.text(-34, -2, marker.label, {
          fontFamily: ADVENTURE_FONT,
          fontSize: marker.label.length > 16 ? "15px" : "17px",
          fontStyle: "700",
          color: enabled ? "#173837" : "#5c5a52",
          wordWrap: { width: 106 },
        }).setOrigin(0, 0.5);
        const hitPlate = this.add.zone(0, 0, 188, 72).setInteractive({ useHandCursor: enabled });
        hitPlate.on("pointerdown", () => {
          if (!enabled) {
            this.flashToast(marker.locked_text || "This place is locked.");
            return;
          }
          this.closeAdventureMapPanel();
          if (this.isExplorationMode()) {
            this.transitionToEngineScenario({ scenario: marker.destination }, {
              type: "location.travel_requested",
              target: marker.id,
              location: marker.id,
              scenario: marker.destination,
            });
            return;
          }
          this.gameEngine.emit("location.travel_requested", {
            target: marker.id,
            location: marker.id,
            scenario: marker.destination,
          });
        });
        container.add([bg, label, hitPlate]);
        return container;
      }

      closeAdventureMapPanel() {
        this.adventureMapPanel?.destroy();
        this.adventureMapPanel = null;
      }

      refreshAdventureScreenState() {
        this.applyAdventureStaticGuideArt();
        this.refreshEngineHotspots();
        this.refreshEngineExitMarker();
        this.refreshAdventureOverlays();
        this.refreshAdventureMapButton();
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

      transitionToEngineScenario(action, event = {}) {
        if (!action.scenario) {
          return;
        }
        const navigate = () => {
          const url = new URL(root.location.href);
          const test = url.searchParams.get("test");
          const debug = url.searchParams.get("debug");
          const explore = url.searchParams.get("explore");
          url.search = "";
          url.searchParams.set("scenario", action.scenario);
          if (event.type === "exit.reached" && event.screen && event.exit_id) {
            url.searchParams.set("arrival_from_scene", event.screen);
            url.searchParams.set("arrival_from_exit", event.exit_id);
            if (Number.isFinite(event.exit_x) && Number.isFinite(event.exit_y)) {
              url.searchParams.set("arrival_x", event.exit_x);
              url.searchParams.set("arrival_y", event.exit_y);
            }
          }
          if (test) url.searchParams.set("test", test);
          if (debug) url.searchParams.set("debug", debug);
          if (explore) url.searchParams.set("explore", explore);
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
        const unlocked = this.isExplorationMode() || (requiredPuzzle
          ? this.gameEngine?.getPuzzleStatus(requiredPuzzle) === "completed"
          : Boolean(this.flags[exit.required_flag]));
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
          const visible = this.levelEditorEnabled ? true : this.isHotspotVisibleForState(hotspot);
          hotspot.marker?.setVisible(visible);
          hotspot.zone?.setVisible(visible);
          hotspot.editorDragTarget?.setVisible(visible);
          hotspot.editorResizeHandle?.setVisible(visible);
          hotspot.editorHandleLabel?.setVisible(visible);
          if (visible) {
            hotspot.zone?.setInteractive?.({ useHandCursor: true });
            hotspot.editorDragTarget?.setInteractive?.({ draggable: true, useHandCursor: true });
            hotspot.editorResizeHandle?.setInteractive?.({ draggable: true, useHandCursor: true });
          } else {
            hotspot.zone?.disableInteractive?.();
            hotspot.editorDragTarget?.disableInteractive?.();
            hotspot.editorResizeHandle?.disableInteractive?.();
          }
        }
      }

      openObjectIntro(hotspot) {
        if (this.isAdventureMode()) {
          this.openAdventureHotspot(hotspot);
          return;
        }
        const puzzleId = this.getHotspotPuzzleId(hotspot);
        if (this.gameEngine && puzzleId && this.gameEngine.getPuzzleStatus(puzzleId) === "locked") {
          this.showSpeechBubble({
            speaker: hotspot.locked_speaker || this.contentModel?.player?.speaker || this.contentModel?.hero?.speaker || "Hero",
            text: hotspot.locked_text || "I need to understand the plan first.",
            bg: hotspot.locked_text_bg || "Първо трябва да разбера плана.",
            anchor: { x: hotspot.x, y: hotspot.y - 40 },
            options: [{ text: "OK", action: () => this.closeBubble() }],
          });
          return;
        }
        super.openObjectIntro(hotspot);
      }

      openAdventureHotspot(hotspot) {
        if (!this.gameEngine) {
          super.openObjectIntro(hotspot);
          return;
        }
        const kind = hotspot.kind || (hotspot.scenery ? "scenery" : "inspect");
        const selectedItem = this.selectedInventoryItemId;
        if (selectedItem && ["use_target", "state_target", "inspect", "scenery"].includes(kind)) {
          const result = this.gameEngine.emit("inventory.item_used_on_hotspot", {
            target: hotspot.id,
            hotspot_id: hotspot.id,
            item: selectedItem,
            screen: this.contentModel?.scene_id,
          });
          if (result.firedRules.length === 0) {
            this.showSpeechBubble({
              speaker: this.contentModel?.player?.speaker || "Alex",
              text: hotspot.wrong_item_text || `Not here. Use ${selectedItem} somewhere else.`,
              bg: hotspot.wrong_item_bg || "Не тук. Използвай предмета другаде.",
              anchor: { x: hotspot.x, y: hotspot.y - 40 },
              options: [{ text: "OK", action: () => this.closeBubble() }],
            });
          }
          this.clearAdventureInventorySelection();
          return;
        }
        if (kind === "takeable") {
          this.gameEngine.emit("item.taken", {
            target: hotspot.item_id || hotspot.id,
            hotspot_id: hotspot.id,
            item: hotspot.item_id || hotspot.id,
            screen: this.contentModel?.scene_id,
          });
          return;
        }
        if (kind === "exit") {
          if (this.tryExplorationTransition("exit.reached", hotspot.id, {
            exit_id: hotspot.id,
            screen: this.contentModel?.scene_id,
            exit_x: hotspot.x,
            exit_y: hotspot.y,
          })) {
            return;
          }
          this.gameEngine.emit("exit.reached", {
            target: hotspot.id,
            exit_id: hotspot.id,
            screen: this.contentModel?.scene_id,
            exit_x: hotspot.x,
            exit_y: hotspot.y,
          });
          return;
        }
        this.gameEngine.emit(hotspot.event || "hotspot.inspected", {
          target: hotspot.id,
          hotspot_id: hotspot.id,
          screen: this.contentModel?.scene_id,
        });
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
        if (this.isAdventureMode() && !exit) {
          return this.add.container(-999, -999).setVisible(false);
        }
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
            if (this.tryExplorationTransition("exit.reached", exit.id, {
              exit_id: exit.id,
              puzzle_id: this.getExitBinding().puzzle_id,
              screen: this.contentModel?.scene_id,
            })) {
              return;
            }
            const emitExitReached = () => this.gameEngine.emit("exit.reached", {
              target: exit.id,
              exit_id: exit.id,
              puzzle_id: this.getExitBinding().puzzle_id,
              screen: this.contentModel?.scene_id,
            });
            if (this.shouldRunExitVocabularyGate()) {
              this.setCommand("Pass the gate review");
              this.openExitVocabularyGate(emitExitReached);
              return;
            }
            emitExitReached();
          });
        });
        marker.zone = zone;
        return marker;
      }

      onGuideClicked() {
        const guide = this.getPrimaryNpcContent?.() || this.contentModel?.guide;
        if (this.isAdventureMode() && this.gameEngine && guide) {
          this.closeBubble();
          this.setCommand(`Talk to ${guide.speaker || guide.label || "helper"}`);
          const walkTo = guide.walk_to || { x: this.guide.x, y: this.guide.y };
          this.walkHeroTo(walkTo.x, walkTo.y, () => {
            this.faceHeroToward(this.guide.x, this.guide.y, "normal");
            this.playGuideTalk();
            if (this.selectedInventoryItemId) {
              const selectedItem = this.selectedInventoryItemId;
              const result = this.gameEngine.emit("inventory.item_given_to_npc", {
                target: guide.id || guide.speaker || "guide",
                npc: guide.id || guide.speaker || "guide",
                item: selectedItem,
                screen: this.contentModel?.scene_id,
              });
              if (result.firedRules.length === 0) {
                this.showSpeechBubble({
                  speaker: guide.speaker || "Guide",
                  text: guide.wrong_item_text || "I do not need this.",
                  bg: guide.wrong_item_bg || "Това не ми трябва.",
                  anchor: { x: this.guide.x, y: this.guide.y - 128 },
                  options: [{ text: "OK", action: () => this.closeBubble() }],
                });
              }
              this.clearAdventureInventorySelection();
              return;
            }
            const result = this.gameEngine.emit("npc.talked", {
              target: guide.id || guide.speaker || "guide",
              npc: guide.id || guide.speaker || "guide",
              screen: this.contentModel?.scene_id,
            });
            if (result.firedRules.length === 0 && guide.default_text) {
              this.showSpeechBubble({
                speaker: guide.speaker || "Guide",
                text: guide.default_text,
                bg: guide.default_text_bg || "",
                anchor: { x: this.guide.x, y: this.guide.y - 128 },
                options: [{ text: "OK", action: () => this.closeBubble() }],
              });
            }
          });
          return;
        }
        const guidePuzzle = this.getGuidePuzzleId();
        if (!this.gameEngine || !guide || !guidePuzzle) {
          super.onGuideClicked();
          return;
        }
        this.closeBubble();
        this.setCommand(`Talk to ${guide.speaker || guide.label || "helper"}`);
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
        const guideBinding = this.getEngineConfig().bindings?.guide || {};
        const primaryNpc = this.getPrimaryNpcContent?.() || this.contentModel?.guide;
        this.gameEngine.emit("guide.completed", {
          target: guideBinding.id || primaryNpc?.id || primaryNpc?.speaker || "guide",
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
