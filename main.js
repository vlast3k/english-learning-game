const SCENARIO_URL = "scenarios/sun-temple-poc.json";
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const ARRIVAL_DISTANCE = 4;

class StateManager {
  constructor(initialState = {}) {
    this.state = {
      currentScene: initialState.currentScene ?? null,
      inventory: Array.isArray(initialState.inventory) ? [...initialState.inventory] : [],
      learnedWords: Array.isArray(initialState.learnedWords) ? [...initialState.learnedWords] : [],
      flags: { ...(initialState.flags ?? {}) },
    };
    this.listeners = new Set();
  }

  getState() {
    return {
      currentScene: this.state.currentScene,
      inventory: [...this.state.inventory],
      learnedWords: this.state.learnedWords.map((word) => ({ ...word })),
      flags: { ...this.state.flags },
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  setCurrentScene(sceneId) {
    if (!sceneId || this.state.currentScene === sceneId) {
      return;
    }

    this.state.currentScene = sceneId;
    this.notify();
  }

  addLearnedWord(word) {
    if (!word?.english || this.state.learnedWords.some((entry) => entry.id === word.id)) {
      return false;
    }

    this.state.learnedWords.push({
      id: word.id,
      english: word.english,
      bulgarian: word.bulgarian,
    });
    this.notify();
    return true;
  }

  hasLearnedWord(wordId) {
    return this.state.learnedWords.some((entry) => entry.id === wordId || entry.english === wordId);
  }

  hasLearnedWords(wordIds = []) {
    return wordIds.every((wordId) => this.hasLearnedWord(wordId));
  }

  setFlag(flag, value = true) {
    if (!flag || this.state.flags[flag] === value) {
      return;
    }

    this.state.flags[flag] = value;
    this.notify();
  }

  notify() {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

class PlayerController {
  constructor({ elements, getScene, onArrive }) {
    this.elements = elements;
    this.getScene = getScene;
    this.onArrive = onArrive;
    this.position = { x: 240, y: 500 };
    this.target = null;
    this.pendingAction = null;
    this.facing = "right";
    this.isWalking = false;
    this.speed = 190;
    this.lastTime = null;
    this.node = this.createPlayerNode();
    this.elements.playerLayer.replaceChildren(this.node);
    this.frameRequest = window.requestAnimationFrame((time) => this.tick(time));
  }

  createPlayerNode() {
    const node = document.createElement("div");
    node.className = "player-sprite facing-right";
    node.setAttribute("aria-label", "Alex the explorer");
    node.innerHTML = `
      <span class="hero-shadow"></span>
      <span class="hero-leg hero-leg-back"></span>
      <span class="hero-leg hero-leg-front"></span>
      <span class="hero-body"></span>
      <span class="hero-strap"></span>
      <span class="hero-head"></span>
      <span class="hero-hat-brim"></span>
      <span class="hero-hat-crown"></span>
      <span class="hero-arm hero-arm-back"></span>
      <span class="hero-arm hero-arm-front"></span>
      <span class="hero-satchel"></span>
    `;
    return node;
  }

  setPosition(point) {
    this.position = { x: point.x, y: point.y };
    this.target = null;
    this.pendingAction = null;
    this.isWalking = false;
    this.render();
  }

  walkTo(point, pendingAction = null) {
    const scene = this.getScene();
    const target = isPointInPolygon(point, scene.walkable_area) ? point : nearestPointInPolygonBounds(point, scene.walkable_area);
    this.target = target;
    this.pendingAction = pendingAction;
    this.isWalking = true;
    this.updateFacing(target.x - this.position.x);
    this.render();
  }

  updateFacing(dx) {
    if (Math.abs(dx) < 1) {
      return;
    }

    this.facing = dx < 0 ? "left" : "right";
  }

  tick(time) {
    if (this.lastTime == null) {
      this.lastTime = time;
    }

    const delta = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.step(delta);
    this.frameRequest = window.requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  step(delta) {
    if (!this.target) {
      return;
    }

    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= ARRIVAL_DISTANCE) {
      this.position = { ...this.target };
      this.target = null;
      this.isWalking = false;
      this.render();

      if (this.pendingAction) {
        const action = this.pendingAction;
        this.pendingAction = null;
        this.onArrive(action);
      }
      return;
    }

    const travel = Math.min(this.speed * delta, distance);
    this.position.x += (dx / distance) * travel;
    this.position.y += (dy / distance) * travel;
    this.updateFacing(dx);
    this.render();
  }

  render() {
    const scale = 0.86 + (this.position.y / WORLD_HEIGHT) * 0.36;
    this.node.style.left = `${(this.position.x / WORLD_WIDTH) * 100}%`;
    this.node.style.top = `${(this.position.y / WORLD_HEIGHT) * 100}%`;
    this.node.style.zIndex = String(Math.round(this.position.y));
    this.node.style.setProperty("--hero-scale", scale.toFixed(3));
    this.node.classList.toggle("is-walking", this.isWalking);
    this.node.classList.toggle("facing-left", this.facing === "left");
    this.node.classList.toggle("facing-right", this.facing === "right");
  }
}

class SceneManager {
  constructor({ scenario, stateManager, elements, onHotspot, onCharacter, onExit, onGround }) {
    this.scenario = scenario;
    this.stateManager = stateManager;
    this.elements = elements;
    this.onHotspot = onHotspot;
    this.onCharacter = onCharacter;
    this.onExit = onExit;
    this.onGround = onGround;
  }

  getCurrentScene() {
    const sceneId = this.stateManager.getState().currentScene;
    return this.scenario.scenes[sceneId];
  }

  renderCurrentScene() {
    const scene = this.getCurrentScene();
    this.elements.backgroundLayer.style.backgroundImage = `url("${scene.background_image}")`;
    this.elements.interactableLayer.replaceChildren(
      ...scene.exits.map((exit) => this.createExit(exit)),
      ...scene.hotspots.map((hotspot) => this.createHotspot(hotspot)),
      ...scene.characters.map((character) => this.createCharacter(character)),
    );
    this.renderSceneStatus();
  }

  renderSceneStatus() {
    const scene = this.getCurrentScene();
    const state = this.stateManager.getState();
    const complete = scene.complete_flag && state.flags[scene.complete_flag];
    this.elements.sceneStatus.textContent = complete ? scene.complete_status_text : scene.status_text;
  }

  refreshStateClasses() {
    const state = this.stateManager.getState();
    this.elements.interactableLayer.querySelectorAll("[data-word-id]").forEach((node) => {
      node.classList.toggle("is-learned", this.stateManager.hasLearnedWord(node.dataset.wordId));
    });
    this.elements.interactableLayer.querySelectorAll("[data-exit-id]").forEach((node) => {
      const scene = this.getCurrentScene();
      const exit = scene.exits.find((item) => item.id === node.dataset.exitId);
      const locked = Boolean(exit?.requires_flag && !state.flags[exit.requires_flag]);
      node.classList.toggle("is-locked", locked);
      node.classList.toggle("is-unlocked", !locked);
    });
    this.renderSceneStatus();
  }

  createHotspot(hotspot) {
    const button = this.createSceneButton(hotspot, `hotspot visual-${hotspot.visual ?? "marker"}`);
    button.dataset.hotspotId = hotspot.id;
    button.dataset.wordId = hotspot.type === "vocabulary" ? hotspot.id : "";
    button.classList.toggle("is-learned", this.stateManager.hasLearnedWord(hotspot.id));
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onHotspot(hotspot);
    });
    return button;
  }

  createCharacter(character) {
    const button = this.createSceneButton(character, `character visual-${character.visual ?? "person"}`);
    button.dataset.characterId = character.id;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onCharacter(character);
    });
    return button;
  }

  createExit(exit) {
    const button = this.createSceneButton(exit, "exit-zone");
    const state = this.stateManager.getState();
    const locked = Boolean(exit.requires_flag && !state.flags[exit.requires_flag]);
    button.dataset.exitId = exit.id;
    button.classList.toggle("is-locked", locked);
    button.classList.toggle("is-unlocked", !locked);
    button.style.width = `${((exit.width ?? 80) / WORLD_WIDTH) * 100}%`;
    button.style.height = `${((exit.height ?? 120) / WORLD_HEIGHT) * 100}%`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onExit(exit);
    });
    return button;
  }

  createSceneButton(entity, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `scene-thing ${className}`;
    button.style.left = `${(entity.x_pos / WORLD_WIDTH) * 100}%`;
    button.style.top = `${(entity.y_pos / WORLD_HEIGHT) * 100}%`;
    button.style.zIndex = String(Math.round(entity.y_pos));
    button.setAttribute("aria-label", entity.label ?? entity.id);

    const label = document.createElement("span");
    label.className = "scene-label";
    label.textContent = entity.label ?? entity.id;
    button.append(label);
    return button;
  }
}

class DialogueManager {
  constructor({ scenario, stateManager, elements, onAction }) {
    this.scenario = scenario;
    this.stateManager = stateManager;
    this.elements = elements;
    this.onAction = onAction;
    this.tree = null;
    this.currentNode = null;
    this.currentTranslation = "";
    this.elements.dialogueTranslateButton.addEventListener("click", () => this.toggleTranslation());
  }

  start(treeId, lockedText = null, speaker = "Guide", lockedTextBg = "") {
    this.elements.gameContainer.classList.add("has-dialogue");

    if (lockedText) {
      this.elements.dialogueBox.hidden = false;
      this.elements.dialogueSpeaker.textContent = speaker;
      this.elements.dialogueText.textContent = lockedText;
      this.setTranslation(lockedTextBg);
      this.elements.dialogueFeedback.hidden = true;
      this.elements.dialogueOptions.replaceChildren(this.createCloseButton());
      return;
    }

    this.tree = this.scenario.dialogues[treeId];
    this.currentNode = this.tree?.start_node ?? null;
    this.renderCurrentNode();
  }

  renderCurrentNode() {
    const node = this.tree?.nodes?.[this.currentNode];
    if (!node) {
      this.close();
      return;
    }

    this.elements.dialogueBox.hidden = false;
    this.elements.dialogueSpeaker.textContent = node.speaker ?? "Guide";
    this.elements.dialogueText.textContent = node.npc_text;
    this.setTranslation(node.npc_text_bg);
    this.elements.dialogueFeedback.hidden = true;
    this.elements.dialogueFeedback.textContent = "";
    this.elements.dialogueOptions.replaceChildren(
      ...node.options.map((option) => this.createOptionButton(option)),
    );
  }

  createOptionButton(option) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-option";
    button.textContent = option.text;
    button.addEventListener("click", () => this.selectOption(option, button));
    return button;
  }

  createCloseButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-option";
    button.textContent = "OK";
    button.addEventListener("click", () => this.close());
    return button;
  }

  setTranslation(text = "") {
    this.currentTranslation = text;
    this.elements.dialogueTranslation.textContent = text;
    this.elements.dialogueTranslation.hidden = true;
    this.elements.dialogueTranslateButton.hidden = !text;
    this.elements.dialogueTranslateButton.setAttribute("aria-pressed", "false");
  }

  toggleTranslation() {
    if (!this.currentTranslation) {
      return;
    }

    const shouldShow = this.elements.dialogueTranslation.hidden;
    this.elements.dialogueTranslation.hidden = !shouldShow;
    this.elements.dialogueTranslateButton.setAttribute("aria-pressed", String(shouldShow));
  }

  selectOption(option, button) {
    if (!option.is_correct) {
      button.classList.add("is-wrong");
      this.elements.dialogueFeedback.hidden = false;
      this.elements.dialogueFeedback.textContent = option.feedback_bg ?? "Опитай пак.";
      return;
    }

    button.classList.add("is-correct");

    if (option.action) {
      this.onAction(option.action);
    }

    if (option.next_node) {
      this.currentNode = option.next_node;
      this.renderCurrentNode();
      return;
    }

    window.setTimeout(() => this.close(), 220);
  }

  close() {
    this.tree = null;
    this.currentNode = null;
    this.elements.dialogueBox.hidden = true;
    this.elements.dialogueSpeaker.textContent = "";
    this.elements.dialogueText.textContent = "";
    this.setTranslation("");
    this.elements.dialogueFeedback.hidden = true;
    this.elements.dialogueFeedback.textContent = "";
    this.elements.dialogueOptions.replaceChildren();
    this.elements.gameContainer.classList.remove("has-dialogue");
  }
}

class GameApp {
  constructor() {
    this.stateManager = new StateManager();
    this.popupTimer = null;
    this.elements = {
      gameContainer: document.querySelector("#game-container"),
      backgroundLayer: document.querySelector("#background-layer"),
      interactableLayer: document.querySelector("#interactable-layer"),
      playerLayer: document.querySelector("#player-layer"),
      inventoryList: document.querySelector("#inventory-list"),
      journalButton: document.querySelector("#journal-button"),
      journalCloseButton: document.querySelector("#journal-close-button"),
      journalModal: document.querySelector("#journal-modal"),
      journalList: document.querySelector("#journal-list"),
      dialogueBox: document.querySelector("#dialogue-box"),
      dialogueSpeaker: document.querySelector("#dialogue-speaker"),
      dialogueText: document.querySelector("#dialogue-text"),
      dialogueTranslation: document.querySelector("#dialogue-translation"),
      dialogueTranslateButton: document.querySelector("#dialogue-translate-button"),
      dialogueFeedback: document.querySelector("#dialogue-feedback"),
      dialogueOptions: document.querySelector("#dialogue-options"),
      sceneStatus: document.querySelector("#scene-status"),
      commandLine: document.querySelector("#command-line"),
      vocabularyPopup: document.querySelector("#vocabulary-popup"),
      vocabularyEnglish: document.querySelector("#vocabulary-english"),
      vocabularyBulgarian: document.querySelector("#vocabulary-bulgarian"),
    };
  }

  async init() {
    this.stateManager.subscribe((state) => this.renderHud(state));
    this.bindGlobalUi();

    try {
      this.scenario = await this.fetchScenario();
      this.stateManager.setCurrentScene(this.scenario.player.start_scene);

      this.dialogueManager = new DialogueManager({
        scenario: this.scenario,
        stateManager: this.stateManager,
        elements: this.elements,
        onAction: (action) => this.runAction(action),
      });
      this.sceneManager = new SceneManager({
        scenario: this.scenario,
        stateManager: this.stateManager,
        elements: this.elements,
        onHotspot: (hotspot) => this.queueHotspot(hotspot),
        onCharacter: (character) => this.queueCharacter(character),
        onExit: (exit) => this.queueExit(exit),
        onGround: (point) => this.walkToGround(point),
      });
      this.playerController = new PlayerController({
        elements: this.elements,
        getScene: () => this.sceneManager.getCurrentScene(),
        onArrive: (action) => this.runQueuedAction(action),
      });

      this.sceneManager.renderCurrentScene();
      this.spawnPlayer(this.scenario.player.start_spawn);
      this.setCommand("Walk to...");

      window.gameState = this.stateManager;
      window.gameScenario = this.scenario;
      window.gamePlayer = this.playerController;
    } catch (error) {
      console.error(error);
      this.elements.sceneStatus.textContent = "Scenario failed to load";
    }
  }

  async fetchScenario() {
    const response = await fetch(SCENARIO_URL);
    if (!response.ok) {
      throw new Error(`Unable to load scenario: ${response.status}`);
    }
    return response.json();
  }

  bindGlobalUi() {
    this.elements.gameContainer.addEventListener("click", (event) => {
      if (event.target.closest(".ui-overlay-layer") || event.target.closest(".scene-thing")) {
        return;
      }

      const point = this.eventToWorldPoint(event);
      this.walkToGround(point);
    });

    this.elements.journalButton.addEventListener("click", () => this.openJournal());
    this.elements.journalCloseButton.addEventListener("click", () => this.closeJournal());
    this.elements.journalModal.addEventListener("click", (event) => {
      if (event.target === this.elements.journalModal) {
        this.closeJournal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.elements.journalModal.hidden) {
        this.closeJournal();
      }
    });
  }

  eventToWorldPoint(event) {
    const rect = this.elements.gameContainer.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT,
    };
  }

  spawnPlayer(spawnId) {
    const scene = this.sceneManager.getCurrentScene();
    const spawn = scene.spawn_points[spawnId] ?? Object.values(scene.spawn_points)[0];
    this.playerController.setPosition(spawn);
  }

  walkToGround(point) {
    const scene = this.sceneManager.getCurrentScene();
    if (!isPointInPolygon(point, scene.walkable_area)) {
      this.setCommand("I can't walk there.");
      return;
    }

    this.hideVocabularyPopup();
    this.dialogueManager.close();
    this.setCommand("Walk to clearing");
    this.playerController.walkTo(point);
  }

  queueHotspot(hotspot) {
    this.hideVocabularyPopup();
    this.dialogueManager.close();
    const verb = hotspot.type === "vocabulary" ? "Look at" : "Use";
    this.setCommand(`${verb} ${hotspot.label}`);
    this.playerController.walkTo(hotspot.walk_to, { type: "hotspot", entity: hotspot });
  }

  queueCharacter(character) {
    this.hideVocabularyPopup();
    this.dialogueManager.close();
    this.setCommand(`Talk to ${character.label}`);
    this.playerController.walkTo(character.walk_to, { type: "character", entity: character });
  }

  queueExit(exit) {
    this.hideVocabularyPopup();
    this.dialogueManager.close();
    this.setCommand(`Walk to ${exit.label}`);
    this.playerController.walkTo(exit.walk_to, { type: "exit", entity: exit });
  }

  runQueuedAction(action) {
    if (action.type === "hotspot") {
      this.interactWithHotspot(action.entity);
    }

    if (action.type === "character") {
      this.interactWithCharacter(action.entity);
    }

    if (action.type === "exit") {
      this.interactWithExit(action.entity);
    }
  }

  interactWithHotspot(hotspot) {
    if (hotspot.type === "vocabulary") {
      this.stateManager.addLearnedWord({
        id: hotspot.id,
        english: hotspot.english_word,
        bulgarian: hotspot.bulgarian_translation,
      });
      this.showVocabularyPopup(hotspot);
      this.sceneManager.refreshStateClasses();
    }

    if (hotspot.type === "dialogue") {
      this.dialogueManager.start(hotspot.dialogue_tree);
    }
  }

  interactWithCharacter(character) {
    if (!this.stateManager.hasLearnedWords(character.requires_learned)) {
      this.dialogueManager.start(null, character.locked_text, character.speaker, character.locked_text_bg);
      return;
    }

    this.dialogueManager.start(character.dialogue_tree);
  }

  interactWithExit(exit) {
    const state = this.stateManager.getState();
    if (exit.requires_flag && !state.flags[exit.requires_flag]) {
      this.dialogueManager.start(null, exit.locked_text, "Alex", exit.locked_text_bg);
      return;
    }

    this.changeScene(exit.target_scene, exit.target_spawn);
  }

  changeScene(sceneId, spawnId) {
    this.stateManager.setCurrentScene(sceneId);
    this.sceneManager.renderCurrentScene();
    this.spawnPlayer(spawnId);
    this.setCommand(`Arrived at ${this.sceneManager.getCurrentScene().title}`);
  }

  runAction(action) {
    if (action.type === "set_flag") {
      this.stateManager.setFlag(action.flag, true);
      this.sceneManager.refreshStateClasses();
    }
  }

  showVocabularyPopup(hotspot) {
    window.clearTimeout(this.popupTimer);
    this.elements.vocabularyEnglish.textContent = hotspot.english_word;
    this.elements.vocabularyBulgarian.textContent = hotspot.bulgarian_translation;
    this.elements.vocabularyPopup.hidden = false;
    this.popupTimer = window.setTimeout(() => this.hideVocabularyPopup(), 1700);
  }

  hideVocabularyPopup() {
    window.clearTimeout(this.popupTimer);
    this.elements.vocabularyPopup.hidden = true;
  }

  setCommand(text) {
    this.elements.commandLine.textContent = text;
  }

  renderHud(state) {
    const visibleItems = state.inventory.length > 0
      ? state.inventory
      : state.learnedWords.map((word) => word.english);

    this.elements.inventoryList.replaceChildren(
      ...visibleItems.map((itemId) => {
        const item = document.createElement("li");
        item.textContent = itemId;
        item.title = itemId;
        return item;
      }),
    );

    if (this.sceneManager) {
      this.sceneManager.refreshStateClasses();
    }

    if (!this.elements.journalModal.hidden) {
      this.renderJournal(state);
    }
  }

  openJournal() {
    this.renderJournal(this.stateManager.getState());
    this.elements.journalModal.hidden = false;
    this.elements.journalCloseButton.focus();
  }

  closeJournal() {
    this.elements.journalModal.hidden = true;
    this.elements.journalButton.focus();
  }

  renderJournal(state) {
    if (state.learnedWords.length === 0) {
      const empty = document.createElement("li");
      empty.className = "journal-empty";
      empty.textContent = "No words yet.";
      this.elements.journalList.replaceChildren(empty);
      return;
    }

    this.elements.journalList.replaceChildren(
      ...state.learnedWords.map((entry) => {
        const item = document.createElement("li");
        const english = document.createElement("strong");
        const bulgarian = document.createElement("span");
        english.textContent = entry.english;
        bulgarian.textContent = entry.bulgarian;
        item.append(english, bulgarian);
        return item;
      }),
    );
  }
}

function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = yi > point.y !== yj > point.y
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function nearestPointInPolygonBounds(point, polygon) {
  const xs = polygon.map((item) => item.x);
  const ys = polygon.map((item) => item.y);
  return {
    x: clamp(point.x, Math.min(...xs), Math.max(...xs)),
    y: clamp(point.y, Math.min(...ys), Math.max(...ys)),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new GameApp();
  app.init();
});
