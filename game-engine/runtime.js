(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const ENGINE_VERSION = 1;
  const MAX_EVENT_HISTORY = 120;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function getPath(source, path) {
    if (!path) {
      return source;
    }
    return String(path).split(".").reduce((value, key) => value?.[key], source);
  }

  function valuesEqual(actual, expected) {
    if (expected === undefined) {
      return Boolean(actual);
    }
    return actual === expected;
  }

  class MemoryStorage {
    constructor() {
      this.values = new Map();
    }

    getItem(key) {
      return this.values.has(key) ? this.values.get(key) : null;
    }

    setItem(key, value) {
      this.values.set(key, String(value));
    }

    removeItem(key) {
      this.values.delete(key);
    }
  }

  const fallbackStorage = new MemoryStorage();

  function resolveStorage(candidate) {
    if (candidate?.getItem && candidate?.setItem) {
      return candidate;
    }
    try {
      if (root.sessionStorage?.getItem) {
        return root.sessionStorage;
      }
    } catch (_error) {
      // Sandboxed documents may deny access to sessionStorage.
    }
    return fallbackStorage;
  }

  class GameState {
    constructor(config = {}, options = {}) {
      this.campaignId = config.campaign_id || "default-campaign";
      this.storageKey = config.storage_key || `english-game:${this.campaignId}`;
      this.storage = resolveStorage(options.storage);
      this.listeners = new Set();
      this.data = this.load(config.initial_state || {});
    }

    createEmpty(initialState) {
      return {
        version: ENGINE_VERSION,
        campaignId: this.campaignId,
        currentScene: null,
        facts: { ...(initialState.facts || {}) },
        inventory: [...(initialState.inventory || [])],
        counters: { ...(initialState.counters || {}) },
        puzzles: { ...(initialState.puzzles || {}) },
        firedRules: [...(initialState.firedRules || [])],
        eventHistory: [],
      };
    }

    load(initialState) {
      let stored = null;
      try {
        stored = JSON.parse(this.storage.getItem(this.storageKey) || "null");
      } catch (_error) {
        stored = null;
      }
      if (!stored || stored.campaignId !== this.campaignId || stored.version !== ENGINE_VERSION) {
        return this.createEmpty(initialState);
      }
      return {
        ...this.createEmpty(initialState),
        ...stored,
        facts: { ...(initialState.facts || {}), ...(stored.facts || {}) },
        inventory: [...new Set(stored.inventory || [])],
        counters: { ...(initialState.counters || {}), ...(stored.counters || {}) },
        puzzles: { ...(initialState.puzzles || {}), ...(stored.puzzles || {}) },
        firedRules: [...new Set(stored.firedRules || [])],
        eventHistory: [...(stored.eventHistory || [])].slice(-MAX_EVENT_HISTORY),
      };
    }

    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    changed(reason) {
      this.persist();
      for (const listener of this.listeners) {
        listener(this.snapshot(), reason);
      }
    }

    persist() {
      this.storage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    reset(initialState = {}) {
      this.data = this.createEmpty(initialState);
      this.changed("state.reset");
    }

    setCurrentScene(sceneId) {
      if (this.data.currentScene === sceneId) {
        return;
      }
      this.data.currentScene = sceneId;
      this.changed("scene.current");
    }

    getFact(name) {
      return this.data.facts[name];
    }

    setFact(name, value = true) {
      if (this.data.facts[name] === value) {
        return;
      }
      this.data.facts[name] = value;
      this.changed(`fact:${name}`);
    }

    incrementCounter(name, amount = 1) {
      this.data.counters[name] = (this.data.counters[name] || 0) + amount;
      this.changed(`counter:${name}`);
      return this.data.counters[name];
    }

    hasInventory(itemId) {
      return this.data.inventory.includes(itemId);
    }

    addInventory(itemId) {
      if (this.hasInventory(itemId)) {
        return false;
      }
      this.data.inventory.push(itemId);
      this.changed(`inventory.add:${itemId}`);
      return true;
    }

    removeInventory(itemId) {
      const before = this.data.inventory.length;
      this.data.inventory = this.data.inventory.filter((item) => item !== itemId);
      if (this.data.inventory.length !== before) {
        this.changed(`inventory.remove:${itemId}`);
        return true;
      }
      return false;
    }

    clearInventory() {
      if (this.data.inventory.length === 0) {
        return;
      }
      this.data.inventory = [];
      this.changed("inventory.clear");
    }

    getPuzzleStatus(puzzleId) {
      return this.data.puzzles[puzzleId] || null;
    }

    setPuzzleStatus(puzzleId, status) {
      if (this.data.puzzles[puzzleId] === status) {
        return;
      }
      this.data.puzzles[puzzleId] = status;
      this.changed(`puzzle:${puzzleId}:${status}`);
    }

    hasFiredRule(ruleId) {
      return this.data.firedRules.includes(ruleId);
    }

    markRuleFired(ruleId) {
      if (this.hasFiredRule(ruleId)) {
        return;
      }
      this.data.firedRules.push(ruleId);
      this.changed(`rule:${ruleId}`);
    }

    recordEvent(event) {
      this.data.eventHistory.push(clone(event));
      this.data.eventHistory = this.data.eventHistory.slice(-MAX_EVENT_HISTORY);
      this.changed(`event:${event.type}`);
    }

    snapshot() {
      return clone(this.data);
    }
  }

  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    on(type, listener) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type).add(listener);
      return () => this.listeners.get(type)?.delete(listener);
    }

    emit(event) {
      for (const listener of this.listeners.get(event.type) || []) {
        listener(event);
      }
      for (const listener of this.listeners.get("*") || []) {
        listener(event);
      }
    }
  }

  class ConditionEvaluator {
    constructor(state, getGraph) {
      this.state = state;
      this.getGraph = getGraph;
    }

    evaluate(condition, event = {}) {
      if (condition === undefined || condition === null) {
        return true;
      }
      if (typeof condition === "boolean") {
        return condition;
      }
      if (Array.isArray(condition)) {
        return condition.every((entry) => this.evaluate(entry, event));
      }
      if (condition.all) {
        return condition.all.every((entry) => this.evaluate(entry, event));
      }
      if (condition.any) {
        return condition.any.some((entry) => this.evaluate(entry, event));
      }
      if (condition.not) {
        return !this.evaluate(condition.not, event);
      }
      if (condition.fact) {
        return valuesEqual(this.state.getFact(condition.fact), condition.equals);
      }
      if (condition.inventory_contains) {
        return this.state.hasInventory(condition.inventory_contains);
      }
      if (condition.inventory_missing) {
        return !this.state.hasInventory(condition.inventory_missing);
      }
      if (condition.counter) {
        const actual = this.state.data.counters[condition.counter] || 0;
        if (condition.at_least !== undefined) {
          return actual >= condition.at_least;
        }
        if (condition.at_most !== undefined) {
          return actual <= condition.at_most;
        }
        return valuesEqual(actual, condition.equals);
      }
      if (condition.puzzle) {
        const status = this.getGraph()?.getStatus(condition.puzzle);
        return status === (condition.status || "completed");
      }
      if (condition.event) {
        return valuesEqual(getPath(event, condition.event), condition.equals);
      }
      throw new Error(`Unsupported condition: ${JSON.stringify(condition)}`);
    }
  }

  class PuzzleGraph {
    constructor(nodes, state, evaluator) {
      this.state = state;
      this.evaluator = evaluator;
      this.nodes = new Map();
      for (const node of nodes || []) {
        if (!node?.id || this.nodes.has(node.id)) {
          throw new Error(`Invalid or duplicate puzzle id: ${node?.id || "<missing>"}`);
        }
        this.nodes.set(node.id, clone(node));
      }
    }

    getNode(puzzleId) {
      return this.nodes.get(puzzleId) || null;
    }

    getStatus(puzzleId) {
      const node = this.getNode(puzzleId);
      if (!node) {
        return "unknown";
      }
      const stored = this.state.getPuzzleStatus(puzzleId);
      if (stored === "completed" || stored === "in_progress") {
        return stored;
      }
      return this.evaluator.evaluate(node.requires) ? "available" : "locked";
    }

    start(puzzleId) {
      const status = this.getStatus(puzzleId);
      if (status === "completed" || status === "in_progress") {
        return status;
      }
      if (status !== "available") {
        throw new Error(`Cannot start locked puzzle: ${puzzleId}`);
      }
      this.state.setPuzzleStatus(puzzleId, "in_progress");
      return "in_progress";
    }

    complete(puzzleId) {
      const node = this.getNode(puzzleId);
      if (!node) {
        throw new Error(`Unknown puzzle: ${puzzleId}`);
      }
      const status = this.getStatus(puzzleId);
      if (status === "completed") {
        return false;
      }
      if (status === "locked") {
        throw new Error(`Cannot complete locked puzzle: ${puzzleId}`);
      }
      this.state.setPuzzleStatus(puzzleId, "completed");
      for (const fact of node.produces || []) {
        this.state.setFact(fact, true);
      }
      return true;
    }

    getMissingRequirements(condition) {
      if (!condition) {
        return [];
      }
      if (condition.all) {
        return condition.all.flatMap((entry) => this.getMissingRequirements(entry));
      }
      if (condition.any) {
        if (condition.any.some((entry) => this.evaluator.evaluate(entry))) {
          return [];
        }
        return [{ any: condition.any.flatMap((entry) => this.getMissingRequirements(entry)) }];
      }
      if (condition.not) {
        return this.evaluator.evaluate(condition) ? [] : [{ not: condition.not }];
      }
      if (this.evaluator.evaluate(condition)) {
        return [];
      }
      if (condition.puzzle) {
        return [{ puzzle: condition.puzzle, status: condition.status || "completed" }];
      }
      if (condition.fact) {
        return [{ fact: condition.fact, equals: condition.equals ?? true }];
      }
      if (condition.inventory_contains) {
        return [{ inventory: condition.inventory_contains }];
      }
      return [clone(condition)];
    }

    describe(puzzleId) {
      const node = this.getNode(puzzleId);
      if (!node) {
        return null;
      }
      return {
        ...clone(node),
        status: this.getStatus(puzzleId),
        missing: this.getMissingRequirements(node.requires),
      };
    }

    list() {
      return [...this.nodes.keys()].map((id) => this.describe(id));
    }

    available() {
      return this.list().filter((node) => node.status === "available");
    }
  }

  function resolveValue(value, event, context) {
    if (Array.isArray(value)) {
      return value.map((entry) => resolveValue(entry, event, context));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveValue(entry, event, context)]));
    }
    if (typeof value !== "string" || !value.startsWith("$")) {
      return value;
    }
    if (value.startsWith("$event.")) {
      return getPath(event, value.slice("$event.".length));
    }
    if (value.startsWith("$content.")) {
      return getPath(context.content, value.slice("$content.".length));
    }
    if (value.startsWith("$fact.")) {
      return context.state.getFact(value.slice("$fact.".length));
    }
    return value;
  }

  class ActionExecutor {
    constructor(context) {
      this.context = context;
    }

    executeAll(actions, event) {
      for (const action of actions || []) {
        this.execute(action, event);
      }
    }

    execute(rawAction, event) {
      const action = resolveValue(rawAction, event, this.context);
      const { state, graph, bridge, bus } = this.context;
      switch (action.type) {
        case "fact.set":
          state.setFact(action.fact, action.value ?? true);
          return;
        case "counter.increment":
          state.incrementCounter(action.counter, action.amount ?? 1);
          return;
        case "inventory.add":
          state.addInventory(action.item);
          bridge?.addInventoryItem?.(action.item);
          return;
        case "inventory.remove":
          state.removeInventory(action.item);
          bridge?.removeInventoryItem?.(action.item);
          return;
        case "inventory.clear":
          state.clearInventory();
          bridge?.clearInventory?.();
          return;
        case "puzzle.start":
          graph.start(action.puzzle);
          return;
        case "puzzle.complete": {
          const changed = graph.complete(action.puzzle);
          if (changed) {
            bus.emit({ type: "puzzle.completed", target: action.puzzle, puzzle_id: action.puzzle });
          }
          return;
        }
        case "flag.set":
          state.setFact(`flag:${action.flag}`, action.value ?? true);
          bridge?.setFlag?.(action.flag, action.value ?? true);
          return;
        case "ui.status.set":
          bridge?.setStatus?.(action.text);
          return;
        case "ui.toast":
          bridge?.showToast?.(action.text);
          return;
        case "ui.inventory.clear_selection":
          bridge?.clearInventorySelection?.();
          return;
        case "ui.map.refresh":
          bridge?.refreshMap?.();
          return;
        case "ui.map.open":
          bridge?.openMap?.();
          return;
        case "ui.vocab.show":
          bridge?.showVocabulary?.(action.hotspot, action.already_retrieved === true);
          return;
        case "hotspot.refresh":
          bridge?.refreshHotspots?.();
          return;
        case "screen.refresh":
          bridge?.refreshScreenState?.();
          return;
        case "exit.refresh":
          bridge?.refreshExit?.();
          return;
        case "dialog.show":
          bridge?.showDialog?.(action);
          return;
        case "event.emit":
          bus.emit({
            ...(action.payload || {}),
            type: action.event,
            target: action.target,
          });
          return;
        case "scene.transition":
          state.persist();
          bridge?.transitionScene?.(action);
          return;
        case "campaign.complete":
          state.setFact(action.fact || "campaign.complete", true);
          bridge?.setStatus?.(action.status_text || "Campaign complete");
          if (action.toast) {
            bridge?.showToast?.(action.toast);
          }
          return;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }
    }
  }

  class RuleEngine {
    constructor(rules, state, evaluator, executor) {
      this.rules = [...(rules || [])].sort((a, b) => (a.priority || 0) - (b.priority || 0));
      this.state = state;
      this.evaluator = evaluator;
      this.executor = executor;
    }

    matches(rule, event) {
      if (rule.event?.type !== event.type) {
        return false;
      }
      if (rule.event.target !== undefined && rule.event.target !== event.target) {
        return false;
      }
      return true;
    }

    handle(event) {
      const fired = [];
      for (const rule of this.rules) {
        if (!this.matches(rule, event)) {
          continue;
        }
        if (rule.once && this.state.hasFiredRule(rule.id)) {
          continue;
        }
        if (!this.evaluator.evaluate(rule.condition, event)) {
          continue;
        }
        this.executor.executeAll(rule.actions, event);
        if (rule.once) {
          this.state.markRuleFired(rule.id);
        }
        fired.push(rule.id);
        if (rule.stop_propagation) {
          break;
        }
      }
      return fired;
    }
  }

  class EngineBusFacade {
    constructor(runtime) {
      this.runtime = runtime;
    }

    on(type, listener) {
      return this.runtime.eventBus.on(type, listener);
    }

    emit(typeOrEvent, payload = {}) {
      if (typeOrEvent && typeof typeOrEvent === "object") {
        return this.runtime.emit(typeOrEvent.type, typeOrEvent);
      }
      return this.runtime.emit(typeOrEvent, payload);
    }
  }

  class DebugOverlay {
    constructor(runtime) {
      this.runtime = runtime;
      this.mode = null;
      this.element = null;
      if (!root.document?.body) {
        return;
      }
      this.keyHandler = (event) => {
        const modes = { F2: "puzzles", F3: "facts", F4: "events", F5: "available" };
        const mode = modes[event.key];
        if (!mode) {
          return;
        }
        event.preventDefault();
        this.toggle(mode);
      };
      root.addEventListener?.("keydown", this.keyHandler);
      this.unsubscribe = runtime.state.subscribe(() => this.render());
      this.unsubscribeEvents = runtime.eventBus.on("*", () => this.render());
    }

    ensureElement() {
      if (this.element || !root.document?.body) {
        return;
      }
      this.element = root.document.createElement("pre");
      this.element.id = "game-engine-debug";
      Object.assign(this.element.style, {
        position: "fixed",
        zIndex: "99999",
        top: "12px",
        right: "12px",
        width: "390px",
        maxHeight: "calc(100vh - 24px)",
        overflow: "auto",
        margin: "0",
        padding: "14px",
        borderRadius: "8px",
        color: "#e9fff8",
        background: "rgba(9, 28, 34, 0.94)",
        border: "1px solid rgba(126, 230, 211, 0.55)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
        font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        whiteSpace: "pre-wrap",
        pointerEvents: "none",
      });
      root.document.body.appendChild(this.element);
    }

    toggle(mode) {
      if (this.mode === mode) {
        this.mode = null;
        if (this.element) {
          this.element.style.display = "none";
        }
        return;
      }
      this.mode = mode;
      this.ensureElement();
      this.element.style.display = "block";
      this.render();
    }

    render() {
      if (!this.mode || !this.element) {
        return;
      }
      const snapshot = this.runtime.getSnapshot();
      if (this.mode === "puzzles") {
        this.element.textContent = `F2 PUZZLE GRAPH\n\n${snapshot.puzzles.map((node) => `${node.status.padEnd(11)} ${node.id}\n  ${node.title || ""}`).join("\n")}`;
      } else if (this.mode === "facts") {
        this.element.textContent = `F3 FACTS\n\n${JSON.stringify(snapshot.state.facts, null, 2)}\n\nINVENTORY\n${JSON.stringify(snapshot.state.inventory, null, 2)}`;
      } else if (this.mode === "events") {
        const events = snapshot.state.eventHistory.slice(-18).map((event) => `${event.type}${event.target ? ` :: ${event.target}` : ""}`);
        this.element.textContent = `F4 EVENT HISTORY\n\n${events.join("\n")}`;
      } else if (this.mode === "available") {
        this.element.textContent = `F5 AVAILABLE PUZZLES\n\n${snapshot.available.map((node) => `${node.id}\n  ${node.title || ""}`).join("\n\n") || "None"}`;
      }
    }

    destroy() {
      root.removeEventListener?.("keydown", this.keyHandler);
      this.unsubscribe?.();
      this.unsubscribeEvents?.();
      this.element?.remove();
    }
  }

  class GameEngineRuntime {
    constructor(config, context = {}) {
      if (!config?.scene_id) {
        throw new Error("game_engine.scene_id is required");
      }
      this.config = clone(config);
      this.context = context;
      this.state = new GameState(config, { storage: context.storage });
      this.eventBus = new EventBus();
      this.evaluator = new ConditionEvaluator(this.state, () => this.graph);
      this.graph = new PuzzleGraph(config.puzzles || [], this.state, this.evaluator);
      this.bus = new EngineBusFacade(this);
      this.executor = new ActionExecutor({
        state: this.state,
        graph: this.graph,
        bridge: context.bridge,
        content: context.content || {},
        bus: this.bus,
      });
      this.rules = new RuleEngine(config.rules || [], this.state, this.evaluator, this.executor);
      this.debugOverlay = config.debug?.enabled === false ? null : new DebugOverlay(this);
      this.state.setCurrentScene(config.scene_id);
    }

    emit(type, payload = {}) {
      const event = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        scene_id: this.config.scene_id,
        timestamp: new Date().toISOString(),
        ...clone(payload),
      };
      event.target = event.target ?? event.hotspot_id ?? event.exit_id ?? event.puzzle_id ?? null;
      this.state.recordEvent(event);
      this.eventBus.emit(event);
      const firedRules = this.rules.handle(event);
      return { event, firedRules, snapshot: this.getSnapshot() };
    }

    getPuzzleStatus(puzzleId) {
      return this.graph.getStatus(puzzleId);
    }

    getPuzzle(puzzleId) {
      return this.graph.describe(puzzleId);
    }

    getSnapshot() {
      return {
        config: clone(this.config),
        state: this.state.snapshot(),
        puzzles: this.graph.list(),
        available: this.graph.available(),
      };
    }

    destroy() {
      this.debugOverlay?.destroy();
      this.state.persist();
    }
  }

  root.EnglishGameEngine = {
    version: ENGINE_VERSION,
    create(config, context) {
      return new GameEngineRuntime(config, context);
    },
    GameState,
    EventBus,
    ConditionEvaluator,
    PuzzleGraph,
    ActionExecutor,
    RuleEngine,
    GameEngineRuntime,
    MemoryStorage,
  };
})();
