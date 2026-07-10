(() => {
  "use strict";

  const CONTENT_CACHE_KEY = "gameContent";
  const SCENE_WIDTH = 1024;
  const SCENE_HEIGHT = 576;
  const ASSET_OVERRIDE_VERSION = "20260710-adventure-polish";
  const ADVENTURE_FONT = '"Merienda", "Trebuchet MS", "Georgia", serif';
  const BUILTIN_DEFAULT_SCENARIO = "scenarios/james-bond-level-01-content.json";
  const BUILTIN_LEVEL_SCENARIOS = {
    1: "scenarios/james-bond-level-01-content.json",
    2: "scenarios/james-bond-level-02-content.json",
    3: "scenarios/james-bond-level-03-content.json",
    4: "scenarios/james-bond-level-04-content.json",
    5: "scenarios/james-bond-level-05-content.json",
    6: "scenarios/james-bond-level-06-content.json",
    7: "scenarios/james-bond-level-07-content.json",
    8: "scenarios/james-bond-level-08-content.json",
    9: "scenarios/james-bond-level-09-content.json",
    10: "scenarios/james-bond-level-10-content.json",
    11: "scenarios/james-bond-level-11-content.json",
  };

  function loadJsonSync(url) {
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

  const SCENARIO_INDEX = loadJsonSync(`scenarios/index.json?v=${ASSET_OVERRIDE_VERSION}`) || {};
  const DEFAULT_SCENARIO = SCENARIO_INDEX.default_scenario || BUILTIN_DEFAULT_SCENARIO;
  const DEFAULT_CONTENT_URL = `${DEFAULT_SCENARIO}?v=${ASSET_OVERRIDE_VERSION}`;
  const LEVEL_SCENARIOS = SCENARIO_INDEX.level_scenarios || BUILTIN_LEVEL_SCENARIOS;
  const LEVEL_EDITOR_PARAMS = new URLSearchParams(window.location?.search || "");
  const LEVEL_EDITOR_ENABLED = ["1", "true", "hotspots"].includes(
    String(LEVEL_EDITOR_PARAMS.get("editor") || LEVEL_EDITOR_PARAMS.get("levelEditor") || "").toLowerCase(),
  );
  function getContentUrl() {
    const locationSearch = window.location?.search || "";
    const params = new URLSearchParams(locationSearch);
    const scenario = params.get("scenario");
    const level = params.get("level");
    if (!scenario) {
      if (LEVEL_SCENARIOS[level]) {
        return `${LEVEL_SCENARIOS[level]}?v=${ASSET_OVERRIDE_VERSION}`;
      }
      return DEFAULT_CONTENT_URL;
    }
    return scenario.includes("?") ? scenario : `${scenario}?v=${ASSET_OVERRIDE_VERSION}`;
  }

  const CONTENT_URL = getContentUrl();

  const loadContentManifest = loadJsonSync;

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

  function installDataDrivenScene(SceneClass) {
    return class DataDrivenScene extends SceneClass {
      preload() {
        const assets = CONTENT_MANIFEST?.assets || {};
        const originalImage = this.load.image.bind(this.load);
        const originalSpritesheet = this.load.spritesheet.bind(this.load);
        if (assets.interactive_props) {
          originalImage("interactiveProps", versionedScenarioAsset(assets.interactive_props));
        }
        if (assets.inventory_icons) {
          originalImage("inventoryIcons", versionedScenarioAsset(assets.inventory_icons));
        }
        if (assets.prop_atlas) {
          originalImage("propAtlas", versionedScenarioAsset(assets.prop_atlas));
        }
        for (const [textureKey, texturePath] of Object.entries(assets.extra_textures || {})) {
          originalImage(textureKey, versionedScenarioAsset(texturePath));
        }
        if (assets.map_ui) {
          originalImage("mapUi", versionedScenarioAsset(assets.map_ui));
        }
        if (assets.npc_mira) {
          originalImage("npcMira", versionedScenarioAsset(assets.npc_mira));
        }
        if (assets.npc_lina) {
          originalImage("npcLina", versionedScenarioAsset(assets.npc_lina));
        }
        if (assets.asset_frames) {
          this.load.json("assetFrames", versionedScenarioAsset(assets.asset_frames));
        }
        for (const [index, framesPath] of (assets.extra_asset_frames || []).entries()) {
          this.load.json(`assetFramesExtra${index}`, versionedScenarioAsset(framesPath));
        }
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
        this.levelEditorEnabled = LEVEL_EDITOR_ENABLED;
        super.create();
        this.applyDataDrivenSceneConfig();
      }

      getCharacterScale(y) {
        const baseScale = this.getCharacterDepthScale(y);
        const multiplier = this.contentModel?.presentation?.character_scale_multiplier;
        return baseScale * (Number.isFinite(multiplier) ? multiplier : 1);
      }

      getGuideCharacterScale(y) {
        const baseScale = this.getCharacterDepthScale(y);
        const multiplier = this.contentModel?.presentation?.npc_scale_multiplier
          ?? this.contentModel?.presentation?.guide_scale_multiplier
          ?? this.contentModel?.presentation?.character_scale_multiplier;
        return baseScale * (Number.isFinite(multiplier) ? multiplier : 1);
      }

      getPrimaryNpcContent() {
        if (!this.contentModel) {
          return null;
        }
        if (this.contentModel.gameplay_mode === "adventure" && Array.isArray(this.contentModel.npcs)) {
          return this.contentModel.npcs.find((npc) => npc.primary !== false) || null;
        }
        return this.contentModel.guide || null;
      }

      getCharacterDepthScale(y) {
        const curve = this.getCharacterDepthScaleConfig();
        if (!curve) {
          return super.getCharacterScale(y);
        }
        const minY = Math.min(curve.back_y, curve.front_y);
        const maxY = Math.max(curve.back_y, curve.front_y);
        const t = maxY === minY ? 1 : Phaser.Math.Clamp((y - minY) / (maxY - minY), 0, 1);
        const backScale = curve.back_y <= curve.front_y ? curve.back_scale : curve.front_scale;
        const frontScale = curve.back_y <= curve.front_y ? curve.front_scale : curve.back_scale;
        return Phaser.Math.Linear(backScale, frontScale, t);
      }

      getCharacterDepthScaleConfig() {
        const configured = this.contentModel?.presentation?.character_depth_scale;
        if (configured &&
          Number.isFinite(configured.back_y) &&
          Number.isFinite(configured.back_scale) &&
          Number.isFinite(configured.front_y) &&
          Number.isFinite(configured.front_scale)) {
          return configured;
        }
        return null;
      }

      ensureCharacterDepthScaleConfig() {
        this.contentModel.presentation = this.contentModel.presentation || {};
        this.contentModel.presentation.character_depth_scale = this.contentModel.presentation.character_depth_scale || {
          back_y: 342,
          back_scale: Number(super.getCharacterScale(342).toFixed(3)),
          front_y: 566,
          front_scale: Number(super.getCharacterScale(566).toFixed(3)),
        };
        return this.contentModel.presentation.character_depth_scale;
      }

      applyDataDrivenSceneConfig() {
        const content = this.contentModel;
        if (!content) {
          return;
        }
        const primaryNpc = this.getPrimaryNpcContent();
        if (primaryNpc?.dialogue_tree) {
          this.guideTree = primaryNpc.dialogue_tree;
        }
        if (content.gameplay_mode === "adventure" && !primaryNpc && this.guide) {
          // Empty adventure screens stay character-free in play, but the editor keeps a
          // visual reference actor so hotspot layout is never blocked by a blank scene.
          this.guide.setVisible(this.levelEditorEnabled);
          this.guide.zone?.disableInteractive?.();
          if (this.levelEditorEnabled) {
            this.guide.setAlpha(0.72);
            this.guide.setPosition(602, 440);
            this.guide.setDepth(440);
            this.guide.setScale(this.getGuideCharacterScale(440));
          }
        }
        if (primaryNpc?.position && this.guide) {
          this.guide.setVisible(true);
          this.guide.setAlpha(1);
          this.guide.zone?.setInteractive?.({ useHandCursor: true });
          this.guide.setPosition(primaryNpc.position.x, primaryNpc.position.y);
          this.guide.setDepth(Math.round(primaryNpc.position.y));
          this.guide.setScale(this.getGuideCharacterScale(primaryNpc.position.y));
          this.guide.zone?.setPosition(primaryNpc.position.x, primaryNpc.position.y - 62);
        }
        if (primaryNpc?.role_label && this.guide) {
          if (!this.guide.roleLabel) {
            this.guide.roleLabel = this.add.text(0, 0, primaryNpc.role_label, {
              fontFamily: ADVENTURE_FONT,
              fontSize: "15px",
              fontStyle: "700",
              color: "#173837",
              backgroundColor: "rgba(255,251,239,0.94)",
              padding: { x: 8, y: 4 },
            }).setOrigin(0.5).setDepth(900);
          }
          this.guide.roleLabel
            .setText(primaryNpc.role_label)
            .setPosition(this.guide.x, this.guide.y - 172)
            .setVisible(true);
        } else if (this.guide?.roleLabel) {
          this.guide.roleLabel.setVisible(false);
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
        if (this.levelEditorEnabled) {
          this.installActorEditor();
        }
      }

      createObjectQuizzes() {
        return this.contentModel?.quizzes || super.createObjectQuizzes();
      }

      openLevelIntro(force = false) {
        if (this.levelEditorEnabled) {
          return;
        }
        super.openLevelIntro(force);
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

        const adventureHotspots = this.contentModel.gameplay_mode === "adventure";
        const idleMarkerAlpha = adventureHotspots && !this.levelEditorEnabled ? 0.24 : 1;
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
          }).setOrigin(0.5).setAlpha(this.levelEditorEnabled || hotspot.label_visible ? 1 : 0);

          marker.add([glow, label]);
          hotspot.glow = glow;
          hotspot.labelText = label;
          this.drawHotspotGlow(hotspot, false);

          const zone = this.add.zone(
            hotspot.x,
            hotspot.y,
            hotspot.radius * 2.4,
            hotspot.radius * 2.4,
          ).setDepth(850).setInteractive({ useHandCursor: true });

          zone.on("pointerover", () => {
            marker.setAlpha(1);
            label.setAlpha(1);
          });
          zone.on("pointerout", () => {
            marker.setAlpha(idleMarkerAlpha);
            label.setAlpha(this.levelEditorEnabled || hotspot.label_visible ? 1 : 0);
          });
          zone.on("pointerdown", () => {
            if (this.levelEditorEnabled) {
              return;
            }
            this.closeBubble();
            this.setCommand(`Look at ${hotspot.label}`);
            const openInteraction = hotspot.scenery
              ? () => this.openSceneryBubble(hotspot)
              : () => this.openObjectIntro(hotspot);
            this.walkHeroTo(hotspot.walkTo.x, hotspot.walkTo.y, openInteraction);
          });

          hotspot.marker = marker;
          hotspot.zone = zone;
          marker.setAlpha(idleMarkerAlpha);
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
        if (this.levelEditorEnabled) {
          this.installHotspotEditor();
        }
      }

      installHotspotEditor() {
        this.closeBubble();
        this.hotspotEditorHandles = [];
        this.hotspots.forEach((hotspot) => this.createHotspotEditorControls(hotspot));
        this.createObstacleEditorControls();
        this.createHotspotEditorPanel();
        this.updateHotspotEditorPanel();
        this.time.delayedCall(0, () => this.setCommand("Editor: drag circles/characters; drag gold handles to resize"));
      }

      installActorEditor() {
        if (this.actorEditorInstalled) {
          return;
        }
        this.actorEditorInstalled = true;
        this.contentModel.presentation = this.contentModel.presentation || {};
        if (this.hero) {
          this.createActorEditorControls({
            id: "hero",
            label: "hero",
            actor: this.hero,
            color: 0x73d7ff,
            getMultiplier: () => this.contentModel.presentation.character_scale_multiplier ?? 1,
            setMultiplier: (value) => {
              this.contentModel.presentation.character_scale_multiplier = value;
            },
            applyPosition: (x, y) => {
              this.contentModel.hero_start = { x, y };
              this.hero.setPosition(x, y);
              this.hero.setDepth(Math.round(y));
              this.hero.setScale(this.getCharacterScale(y));
            },
          });
        }
        if (this.guide && (!this.isAdventureMode?.() || this.getPrimaryNpcContent())) {
          const primaryNpc = this.getPrimaryNpcContent();
          const usesAdventureNpcs = this.contentModel.gameplay_mode === "adventure" && Array.isArray(this.contentModel.npcs);
          this.guide.zone?.disableInteractive();
          this.createActorEditorControls({
            id: "guide",
            label: primaryNpc?.id || "guide",
            actor: this.guide,
            color: 0xe88957,
            getMultiplier: () => this.contentModel.presentation.npc_scale_multiplier
              ?? this.contentModel.presentation.guide_scale_multiplier
              ?? this.contentModel.presentation.character_scale_multiplier
              ?? 1,
            setMultiplier: (value) => {
              if (usesAdventureNpcs) {
                this.contentModel.presentation.npc_scale_multiplier = value;
              } else {
                this.contentModel.presentation.guide_scale_multiplier = value;
              }
            },
            applyPosition: (x, y) => {
              if (usesAdventureNpcs) {
                const npc = this.getPrimaryNpcContent();
                if (npc) {
                  npc.position = { x, y };
                }
              } else {
                this.contentModel.guide = this.contentModel.guide || {};
                this.contentModel.guide.position = { x, y };
              }
              this.guide.setPosition(x, y);
              this.guide.setDepth(Math.round(y));
              this.guide.setScale(this.getGuideCharacterScale(y));
              this.guide.zone?.setPosition(x, y - 62);
              this.guide.roleLabel?.setPosition(x, y - 172);
            },
          });
        }
        this.createDepthScaleEditorControls();
        this.updateHotspotEditorPanel();
      }

      createDepthScaleEditorControls() {
        if (this.depthScaleEditorControls) {
          return;
        }
        this.ensureCharacterDepthScaleConfig();
        this.depthScaleEditorControls = ["back", "front"].map((kind) => {
          const graphics = this.add.graphics().setDepth(904);
          const lineHandle = this.add.rectangle(28, 0, 48, 16, 0x8d5bd1, 0.98)
            .setDepth(909)
            .setStrokeStyle(2, 0xfffbef, 0.8)
            .setInteractive({ draggable: true, useHandCursor: true });
          const sizeHandle = this.add.circle(0, 0, 8, 0xf0b74f, 0.98)
            .setDepth(910)
            .setStrokeStyle(2, 0x173837, 0.9)
            .setInteractive({ draggable: true, useHandCursor: true });
          const label = this.add.text(56, 0, "", {
            fontFamily: ADVENTURE_FONT,
            fontSize: "11px",
            fontStyle: "700",
            color: "#173837",
            backgroundColor: "rgba(255,251,239,0.94)",
            padding: { x: 5, y: 2 },
          }).setDepth(910);
          this.input.setDraggable(lineHandle);
          this.input.setDraggable(sizeHandle);
          const control = { kind, graphics, lineHandle, sizeHandle, label, visible: true };
          lineHandle.on("drag", (_pointer, _dragX, dragY) => {
            this.moveDepthScaleGuide(control, Math.round(dragY));
          });
          sizeHandle.on("drag", (_pointer, dragX) => {
            this.resizeDepthScaleGuide(control, dragX);
          });
          this.updateDepthScaleEditorControl(control);
          return control;
        });
        this.applyDepthScaleToActors();
      }

      moveDepthScaleGuide(control, y) {
        const curve = this.ensureCharacterDepthScaleConfig();
        curve[`${control.kind}_y`] = Phaser.Math.Clamp(y, 0, SCENE_HEIGHT);
        this.applyDepthScaleToActors();
        this.updateDepthScaleEditorControls();
        this.updateHotspotEditorPanel();
      }

      resizeDepthScaleGuide(control, x) {
        const curve = this.ensureCharacterDepthScaleConfig();
        const scale = Phaser.Math.Clamp((x - 720) / 260, 0.3, 0.95);
        curve[`${control.kind}_scale`] = Number(scale.toFixed(3));
        this.applyDepthScaleToActors();
        this.updateDepthScaleEditorControls();
        this.updateHotspotEditorPanel();
      }

      applyDepthScaleToActors() {
        this.hero?.setScale(this.getCharacterScale(this.hero.y));
        this.guide?.setScale(this.getGuideCharacterScale(this.guide.y));
        if (this.heroEditor) {
          this.updateActorEditorControls(this.heroEditor);
        }
        if (this.guideEditor) {
          this.updateActorEditorControls(this.guideEditor);
        }
      }

      updateDepthScaleEditorControls() {
        this.depthScaleEditorControls?.forEach((control) => this.updateDepthScaleEditorControl(control));
      }

      updateDepthScaleEditorControl(control) {
        const curve = this.ensureCharacterDepthScaleConfig();
        const y = curve[`${control.kind}_y`];
        const scale = curve[`${control.kind}_scale`];
        const handleX = 720 + scale * 260;
        control.graphics.clear();
        control.graphics.setVisible(control.visible);
        control.lineHandle.setVisible(control.visible);
        control.sizeHandle.setVisible(control.visible);
        control.label.setVisible(control.visible);
        if (!control.visible) {
          return;
        }
        control.graphics.lineStyle(2, 0x8d5bd1, 0.88);
        control.graphics.lineBetween(0, y, SCENE_WIDTH, y);
        control.graphics.lineStyle(1, 0xfffbef, 0.62);
        control.graphics.lineBetween(0, y + 3, SCENE_WIDTH, y + 3);
        control.lineHandle.setPosition(28, y);
        control.sizeHandle.setPosition(handleX, y);
        control.label
          .setText(`${control.kind} depth y:${Math.round(y)} scale:${scale.toFixed(3)}`)
          .setPosition(56, Math.max(0, y - 14));
      }

      getDepthScaleEditorPatch() {
        const curve = this.ensureCharacterDepthScaleConfig();
        return {
          back_y: Math.round(curve.back_y),
          back_scale: Number(curve.back_scale.toFixed(3)),
          front_y: Math.round(curve.front_y),
          front_scale: Number(curve.front_scale.toFixed(3)),
        };
      }

      createActorEditorControls(config) {
        const { actor, id, color } = config;
        const ring = this.add.graphics().setDepth(913);
        const dragTarget = this.add.zone(actor.x, actor.y - 62, 86, 132)
          .setDepth(914)
          .setInteractive({ draggable: true, useHandCursor: true });
        const sizeHandle = this.add.circle(0, 0, 8, 0xf0b74f, 0.96)
          .setDepth(916)
          .setStrokeStyle(2, 0x173837, 0.9)
          .setInteractive({ draggable: true, useHandCursor: true });
        const labelText = this.add.text(0, 0, "", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "13px",
          fontStyle: "700",
          color: "#173837",
          backgroundColor: "rgba(255,251,239,0.94)",
          padding: { x: 6, y: 3 },
        }).setOrigin(0.5).setDepth(916);
        this.input.setDraggable(dragTarget);
        this.input.setDraggable(sizeHandle);
        const editor = { ...config, actorLabel: config.label, ring, dragTarget, sizeHandle, labelText };
        dragTarget.on("drag", (_pointer, dragX, dragY) => {
          this.moveEditedActor(editor, Math.round(dragX), Math.round(dragY + 62));
        });
        sizeHandle.on("drag", (_pointer, dragX, dragY) => {
          this.resizeEditedActor(editor, dragX, dragY);
        });
        this[`${id}Editor`] = editor;
        this.updateActorEditorControls(editor);
      }

      moveEditedActor(editor, x, y) {
        editor.applyPosition(Phaser.Math.Clamp(x, 0, SCENE_WIDTH), Phaser.Math.Clamp(y, 0, SCENE_HEIGHT));
        this.updateActorEditorControls(editor);
        this.updateHotspotEditorPanel();
      }

      resizeEditedActor(editor, dragX, dragY) {
        const distance = Phaser.Math.Distance.Between(editor.actor.x, editor.actor.y, dragX, dragY);
        const displayScale = Phaser.Math.Clamp(distance / 70, 0.35, 1.85);
        const baseScale = this.getCharacterDepthScale(editor.actor.y);
        const multiplier = Number(Phaser.Math.Clamp(displayScale / baseScale, 0.55, 3.2).toFixed(2));
        editor.setMultiplier(multiplier);
        editor.actor.setScale(editor.id === "guide" ? this.getGuideCharacterScale(editor.actor.y) : this.getCharacterScale(editor.actor.y));
        this.updateActorEditorControls(editor);
        this.updateHotspotEditorPanel();
      }

      updateActorEditorControls(editor) {
        const { actor, ring, dragTarget, sizeHandle, labelText, color } = editor;
        const scale = actor.scaleX || 1;
        ring.clear();
        ring.lineStyle(3, color, 0.92);
        ring.strokeEllipse(actor.x, actor.y - 62, 76 * scale, 126 * scale);
        ring.lineStyle(1, 0xfffbef, 0.72);
        ring.strokeEllipse(actor.x, actor.y - 62, 90 * scale, 140 * scale);
        dragTarget.setPosition(actor.x, actor.y - 62);
        sizeHandle.setPosition(actor.x + 70 * scale, actor.y);
        labelText
          .setText(`${editor.actorLabel}\nx:${Math.round(actor.x)} y:${Math.round(actor.y)} size:${editor.getMultiplier().toFixed(2)}`)
          .setPosition(actor.x, actor.y - 152 * scale);
      }

      createObstacleEditorControls() {
        this.obstacleEditorControls = [];
        (this.obstacles || []).forEach((obstacle) => {
          this.normalizeEditedObstacle(obstacle);
          const graphics = this.add.graphics().setDepth(906);
          const dragTarget = this.add.zone(
            (obstacle.x1 + obstacle.x2) / 2,
            (obstacle.y1 + obstacle.y2) / 2,
            obstacle.x2 - obstacle.x1,
            obstacle.y2 - obstacle.y1,
          ).setDepth(907).setInteractive({ draggable: true, useHandCursor: true });
          const resizeHandle = this.add.rectangle(obstacle.x2, obstacle.y2, 12, 12, 0x73d7ff, 0.98)
            .setDepth(908)
            .setStrokeStyle(2, 0x173837, 0.9)
            .setInteractive({ draggable: true, useHandCursor: true });
          const label = this.add.text(obstacle.x1, obstacle.y1 - 18, "", {
            fontFamily: ADVENTURE_FONT,
            fontSize: "11px",
            fontStyle: "700",
            color: "#173837",
            backgroundColor: "rgba(255,251,239,0.94)",
            padding: { x: 5, y: 2 },
          }).setDepth(908);
          this.input.setDraggable(dragTarget);
          this.input.setDraggable(resizeHandle);
          const control = { obstacle, graphics, dragTarget, resizeHandle, label, visible: true };
          dragTarget.on("drag", (_pointer, dragX, dragY) => {
            this.moveEditedObstacle(control, Math.round(dragX), Math.round(dragY));
          });
          resizeHandle.on("drag", (_pointer, dragX, dragY) => {
            this.resizeEditedObstacle(control, Math.round(dragX), Math.round(dragY));
          });
          this.obstacleEditorControls.push(control);
          this.updateObstacleEditorControl(control);
        });
      }

      normalizeEditedObstacle(obstacle) {
        const x1 = Math.min(obstacle.x1, obstacle.x2);
        const x2 = Math.max(obstacle.x1, obstacle.x2);
        const y1 = Math.min(obstacle.y1, obstacle.y2);
        const y2 = Math.max(obstacle.y1, obstacle.y2);
        obstacle.x1 = x1;
        obstacle.x2 = x2;
        obstacle.y1 = y1;
        obstacle.y2 = y2;
      }

      moveEditedObstacle(control, centerX, centerY) {
        const { obstacle } = control;
        const width = obstacle.x2 - obstacle.x1;
        const height = obstacle.y2 - obstacle.y1;
        const x1 = Phaser.Math.Clamp(centerX - width / 2, 0, SCENE_WIDTH - width);
        const y1 = Phaser.Math.Clamp(centerY - height / 2, 0, SCENE_HEIGHT - height);
        obstacle.x1 = Math.round(x1);
        obstacle.y1 = Math.round(y1);
        obstacle.x2 = Math.round(x1 + width);
        obstacle.y2 = Math.round(y1 + height);
        this.updateObstacleEditorControl(control);
        this.updateHotspotEditorPanel();
      }

      resizeEditedObstacle(control, x2, y2) {
        const { obstacle } = control;
        obstacle.x2 = Phaser.Math.Clamp(x2, obstacle.x1 + 18, SCENE_WIDTH);
        obstacle.y2 = Phaser.Math.Clamp(y2, obstacle.y1 + 18, SCENE_HEIGHT);
        this.updateObstacleEditorControl(control);
        this.updateHotspotEditorPanel();
      }

      updateObstacleEditorControl(control) {
        const { obstacle, graphics, dragTarget, resizeHandle, label, visible } = control;
        const width = obstacle.x2 - obstacle.x1;
        const height = obstacle.y2 - obstacle.y1;
        graphics.clear();
        graphics.setVisible(visible);
        dragTarget.setVisible(visible);
        resizeHandle.setVisible(visible);
        label.setVisible(visible);
        if (!visible) {
          return;
        }
        graphics.fillStyle(0x2f9edb, 0.16);
        graphics.lineStyle(2, 0x2f9edb, 0.95);
        graphics.fillRect(obstacle.x1, obstacle.y1, width, height);
        graphics.strokeRect(obstacle.x1, obstacle.y1, width, height);
        graphics.lineStyle(1, 0xfffbef, 0.75);
        graphics.strokeRect(obstacle.x1 + 3, obstacle.y1 + 3, Math.max(1, width - 6), Math.max(1, height - 6));
        dragTarget
          .setPosition(obstacle.x1 + width / 2, obstacle.y1 + height / 2)
          .setSize(width, height);
        resizeHandle.setPosition(obstacle.x2, obstacle.y2);
        label
          .setText(`${obstacle.id || "obstacle"}\n${Math.round(obstacle.x1)},${Math.round(obstacle.y1)} ${Math.round(obstacle.x2)},${Math.round(obstacle.y2)}`)
          .setPosition(obstacle.x1, Math.max(0, obstacle.y1 - 32));
      }

      toggleObstacleEditorControls() {
        const nextVisible = !(this.obstacleEditorControls?.[0]?.visible ?? true);
        this.obstacleEditorControls?.forEach((control) => {
          control.visible = nextVisible;
          this.updateObstacleEditorControl(control);
        });
        this.hotspotEditorPanel?.obstacleToggle?.setText(`Obstacles: ${nextVisible ? "on" : "off"}`);
      }

      toggleDepthScaleEditorControls() {
        const nextVisible = !(this.depthScaleEditorControls?.[0]?.visible ?? true);
        this.depthScaleEditorControls?.forEach((control) => {
          control.visible = nextVisible;
          this.updateDepthScaleEditorControl(control);
        });
        this.hotspotEditorPanel?.depthToggle?.setText(`Depth: ${nextVisible ? "on" : "off"}`);
      }

      createHotspotEditorControls(hotspot) {
        hotspot.labelText?.setAlpha(1);
        this.updateHotspotEditorLabel(hotspot);
        hotspot.zone.disableInteractive();

        const dragTarget = this.add.zone(hotspot.x, hotspot.y, hotspot.radius * 2, hotspot.radius * 2)
          .setDepth(910)
          .setInteractive({ draggable: true, useHandCursor: true });
        const handle = this.add.circle(hotspot.x + hotspot.radius, hotspot.y, 8, 0xf0b74f, 0.96)
          .setDepth(912)
          .setStrokeStyle(2, 0x173837, 0.9)
          .setInteractive({ draggable: true, useHandCursor: true });
        this.input.setDraggable(dragTarget);
        this.input.setDraggable(handle);
        const handleLabel = this.add.text(handle.x, handle.y - 22, "resize", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "11px",
          fontStyle: "700",
          color: "#173837",
          backgroundColor: "rgba(255,251,239,0.94)",
          padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(912).setAlpha(0.82);

        dragTarget.on("drag", (_pointer, dragX, dragY) => {
          this.moveEditedHotspot(hotspot, Math.round(dragX), Math.round(dragY));
        });
        handle.on("drag", (_pointer, dragX, dragY) => {
          const radius = Phaser.Math.Clamp(Math.round(Phaser.Math.Distance.Between(hotspot.x, hotspot.y, dragX, dragY)), 12, 140);
          this.resizeEditedHotspot(hotspot, radius);
        });
        handle.on("pointerover", () => handleLabel.setAlpha(1));
        handle.on("pointerout", () => handleLabel.setAlpha(0.82));

        hotspot.editorDragTarget = dragTarget;
        hotspot.editorResizeHandle = handle;
        hotspot.editorHandleLabel = handleLabel;
        this.hotspotEditorHandles.push(dragTarget, handle, handleLabel);
      }

      moveEditedHotspot(hotspot, x, y) {
        hotspot.x = Phaser.Math.Clamp(x, 0, SCENE_WIDTH);
        hotspot.y = Phaser.Math.Clamp(y, 0, SCENE_HEIGHT);
        hotspot.marker.setPosition(hotspot.x, hotspot.y);
        hotspot.editorDragTarget.setPosition(hotspot.x, hotspot.y);
        hotspot.zone.setPosition(hotspot.x, hotspot.y);
        this.positionHotspotEditorHandle(hotspot);
        this.updateHotspotEditorLabel(hotspot);
        this.updateHotspotEditorPanel();
      }

      resizeEditedHotspot(hotspot, radius) {
        hotspot.radius = radius;
        hotspot.marker.setSize(radius * 2, radius * 2);
        hotspot.editorDragTarget.setSize(radius * 2, radius * 2);
        hotspot.zone.setSize(radius * 2.4, radius * 2.4);
        hotspot.labelText?.setPosition(0, radius + 13);
        this.drawHotspotGlow(hotspot, this.learnedWords.includes(hotspot.id));
        this.positionHotspotEditorHandle(hotspot);
        this.updateHotspotEditorLabel(hotspot);
        this.updateHotspotEditorPanel();
      }

      positionHotspotEditorHandle(hotspot) {
        hotspot.editorResizeHandle?.setPosition(hotspot.x + hotspot.radius, hotspot.y);
        hotspot.editorHandleLabel?.setPosition(hotspot.x + hotspot.radius, hotspot.y - 22);
      }

      updateHotspotEditorLabel(hotspot) {
        hotspot.labelText?.setText(`${hotspot.id}\nx:${Math.round(hotspot.x)} y:${Math.round(hotspot.y)} r:${Math.round(hotspot.radius)}`);
      }

      createHotspotEditorPanel() {
        const panel = this.add.container(18, SCENE_HEIGHT - 150).setDepth(940);
        const bg = this.add.graphics();
        bg.fillStyle(0xfffbef, 0.95);
        bg.lineStyle(2, 0x173837, 0.28);
        bg.fillRoundedRect(0, 0, 360, 132, 8);
        bg.strokeRoundedRect(0, 0, 360, 132, 8);
        const title = this.add.text(14, 12, "Hotspot editor", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "16px",
          fontStyle: "700",
          color: "#173837",
        });
        const obstacleToggle = this.add.text(205, 12, "Obstacles: on", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "11px",
          fontStyle: "700",
          color: "#fff4cf",
          backgroundColor: "#174846",
          padding: { x: 7, y: 5 },
        }).setInteractive({ useHandCursor: true });
        const depthToggle = this.add.text(205, 38, "Depth: on", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "11px",
          fontStyle: "700",
          color: "#fff4cf",
          backgroundColor: "#4c3d86",
          padding: { x: 7, y: 5 },
        }).setInteractive({ useHandCursor: true });
        const help = this.add.text(14, 40, "Drag circles to move. Drag gold dots to resize.\nS save. C copy. H hide panels.", {
          fontFamily: ADVENTURE_FONT,
          fontSize: "12px",
          color: "#314742",
          lineSpacing: 3,
        });
        const output = this.add.text(14, 82, "", {
          fontFamily: '"Menlo", "Consolas", monospace',
          fontSize: "11px",
          color: "#173837",
          wordWrap: { width: 330 },
        });
        obstacleToggle.on("pointerdown", () => this.toggleObstacleEditorControls());
        depthToggle.on("pointerdown", () => this.toggleDepthScaleEditorControls());
        panel.add([bg, title, obstacleToggle, depthToggle, help, output]);
        this.hotspotEditorPanel = { panel, output, obstacleToggle, depthToggle };
        this.input.keyboard?.on("keydown-C", () => this.copyHotspotEditorPatch());
        this.input.keyboard?.on("keydown-S", () => this.saveHotspotEditorPatch());
        this.input.keyboard?.on("keydown-H", () => this.toggleEditorPanels());
      }

      toggleEditorPanels() {
        const visible = !this.hotspotEditorPanel?.panel.visible;
        this.hotspotEditorPanel?.panel.setVisible(visible);
      }

      getHotspotEditorPatch() {
        return this.hotspots.map((hotspot) => ({
          id: hotspot.id,
          x: Math.round(hotspot.x),
          y: Math.round(hotspot.y),
          radius: Math.round(hotspot.radius),
        }));
      }

      getActorEditorPatch() {
        const presentation = this.contentModel?.presentation || {};
        const primaryNpc = this.getPrimaryNpcContent();
        const isAdventureScreen = this.contentModel?.gameplay_mode === "adventure";
        const usesAdventureNpcs = this.contentModel?.gameplay_mode === "adventure" && Boolean(primaryNpc);
        const patch = {
          hero: this.hero ? {
            x: Math.round(this.hero.x),
            y: Math.round(this.hero.y),
            scale_multiplier: Number((presentation.character_scale_multiplier ?? 1).toFixed(2)),
          } : null,
        };
        if (this.guide && (!isAdventureScreen || primaryNpc)) {
          patch[usesAdventureNpcs ? "npc" : "guide"] = {
            x: Math.round(this.guide.x),
            y: Math.round(this.guide.y),
            scale_multiplier: Number((
              presentation.npc_scale_multiplier
              ?? presentation.guide_scale_multiplier
              ?? presentation.character_scale_multiplier
              ?? 1
            ).toFixed(2)),
          };
        }
        return patch;
      }

      getObstacleEditorPatch() {
        return (this.obstacles || []).map((obstacle) => ({
          id: obstacle.id,
          x1: Math.round(obstacle.x1),
          y1: Math.round(obstacle.y1),
          x2: Math.round(obstacle.x2),
          y2: Math.round(obstacle.y2),
        }));
      }

      updateHotspotEditorPanel(status = "") {
        if (!this.hotspotEditorPanel) {
          return;
        }
        const patch = JSON.stringify({
          hotspots: this.getHotspotEditorPatch(),
          actors: this.getActorEditorPatch(),
          obstacles: this.getObstacleEditorPatch(),
          depth_scale: this.getDepthScaleEditorPatch(),
        }, null, 2);
        const suffix = status ? `\n${status}` : "";
        this.hotspotEditorPanel.output.setText(`${patch.slice(0, 250)}${patch.length > 250 ? "\n..." : ""}${suffix}`);
      }

      copyHotspotEditorPatch() {
        const patch = JSON.stringify({
          hotspots: this.getHotspotEditorPatch(),
          actors: this.getActorEditorPatch(),
          obstacles: this.getObstacleEditorPatch(),
          depth_scale: this.getDepthScaleEditorPatch(),
        }, null, 2);
        if (!navigator.clipboard?.writeText) {
          console.info("Hotspot JSON patch:", patch);
          this.updateHotspotEditorPanel("Clipboard unavailable; patch logged to console.");
          return;
        }
        navigator.clipboard.writeText(patch)
          .then(() => this.updateHotspotEditorPanel("Copied hotspot patch."))
          .catch(() => {
            console.info("Hotspot JSON patch:", patch);
            this.updateHotspotEditorPanel("Clipboard blocked; patch logged to console.");
          });
      }

      async saveHotspotEditorPatch() {
        this.updateHotspotEditorPanel("Saving...");
        try {
          const scenario = new URL(window.EnglishGameContent?.url || "", window.location.href).pathname;
          const response = await fetch("/__level-editor/save-hotspots", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              scenario,
              hotspots: this.getHotspotEditorPatch(),
              actors: this.getActorEditorPatch(),
              obstacles: this.getObstacleEditorPatch(),
              depth_scale: this.getDepthScaleEditorPatch(),
            }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.ok) {
            throw new Error(result.error || `Save failed with HTTP ${response.status}`);
          }
          this.updateHotspotEditorPanel(`Saved ${result.saved} hotspots to ${result.scenario}.`);
          this.setCommand("Editor: saved hotspot positions");
        } catch (error) {
          console.error(error);
          this.updateHotspotEditorPanel(`Save failed: ${error.message}`);
          this.setCommand("Editor save failed");
        }
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
                speaker: exit.locked_speaker || this.contentModel?.player?.speaker || this.contentModel?.hero?.speaker || "Hero",
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
        const guideContent = this.getPrimaryNpcContent();
        if (!guideContent) {
          super.onGuideClicked();
          return;
        }

        this.closeBubble();
        this.setCommand(`Talk to ${guideContent.speaker || guideContent.label || "helper"}`);
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
      const dataDrivenScenes = scenes.map((SceneClass) => installDataDrivenScene(SceneClass));
      super({ ...config, scene: dataDrivenScenes });
    }
  };

  window.EnglishGameContent = {
    cacheKey: CONTENT_CACHE_KEY,
    url: CONTENT_URL,
    defaultScenario: DEFAULT_SCENARIO,
    levelScenarios: LEVEL_SCENARIOS,
  };
})();
