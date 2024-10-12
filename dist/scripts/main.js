// scripts/main.ts
import {
  world as world2,
  system,
  BlockPermutation as BlockPermutation2,
  ItemStack,
  DisplaySlotId
} from "@minecraft/server";

// scripts/Utilities.ts
import { world } from "@minecraft/server";
var Utilities = class {
  static fillBlock(blockPerm, xFrom, yFrom, zFrom, xTo, yTo, zTo) {
    const overworld = world.getDimension("overworld");
    for (let i = xFrom; i <= xTo; i++) {
      for (let j = yFrom; j <= yTo; j++) {
        for (let k = zFrom; k <= zTo; k++) {
          overworld.getBlock({ x: i, y: j, z: k })?.setPermutation(blockPerm);
        }
      }
    }
  }
  static fourWalls(perm, xFrom, yFrom, zFrom, xTo, yTo, zTo) {
    const overworld = world.getDimension("overworld");
    for (let i = xFrom; i <= xTo; i++) {
      for (let k = yFrom; k <= yTo; k++) {
        overworld.getBlock({ x: i, y: k, z: zFrom })?.setPermutation(perm);
        overworld.getBlock({ x: i, y: k, z: zTo })?.setPermutation(perm);
      }
    }
    for (let j = zFrom + 1; j < zTo; j++) {
      for (let k = yFrom; k <= yTo; k++) {
        overworld.getBlock({ x: xFrom, y: k, z: j })?.setPermutation(perm);
        overworld.getBlock({ x: xTo, y: k, z: j })?.setPermutation(perm);
      }
    }
  }
};

// scripts/main.ts
var START_TICK = 100;
var ARENA_X_SIZE = 30;
var ARENA_Z_SIZE = 30;
var ARENA_X_OFFSET = 0;
var ARENA_Y_OFFSET = -60;
var ARENA_Z_OFFSET = 0;
var score = 0;
var cottaX = 0;
var cottaZ = 0;
var spawnCountdown = 1;
var curTick = 0;
function initializeBreakTheWeb() {
  const overworld = world2.getDimension("overworld");
  let nightTime;
  let survival;
  nightTime = world2.setTimeOfDay(13e3);
  let scoreObjective = world2.scoreboard.getObjective("score");
  if (!scoreObjective) {
    scoreObjective = world2.scoreboard.addObjective("score", "Level");
  }
  let entities = overworld.getEntities({
    excludeTypes: ["player"]
  });
  for (let entity of entities) {
    entity.kill();
  }
  world2.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
    objective: scoreObjective
  });
  const players = world2.getAllPlayers();
  for (const player of players) {
    let checkInventory2 = function() {
      let inv = player.getComponent("inventory");
      let hasDiamondSword = false;
      let hasDirt = false;
      for (let i = 0; i < inv.inventorySize; i++) {
        let item = inv.container?.getItem(i);
        if (item) {
          if (item.typeId === "minecraft:diamond_sword") {
            hasDiamondSword = true;
          }
          if (item.typeId === "minecraft:dirt") {
            hasDirt = true;
          }
        }
      }
      if (!hasDiamondSword) {
        inv.container?.addItem(new ItemStack("minecraft:diamond_sword", 1));
      }
      if (!hasDirt) {
        inv.container?.addItem(new ItemStack("minecraft:dirt", 64));
      }
    };
    var checkInventory = checkInventory2;
    scoreObjective.setScore(player, 0);
    checkInventory2();
    player.teleport(
      {
        x: ARENA_X_OFFSET - 3,
        y: ARENA_Y_OFFSET,
        z: ARENA_Z_OFFSET - 3
      },
      {
        dimension: overworld,
        rotation: { x: 0, y: 0 }
      }
    );
  }
  let airBlockPerm = BlockPermutation2.resolve("minecraft:air");
  let cobblestoneBlockPerm = BlockPermutation2.resolve("minecraft:mossy_cobblestone");
  if (airBlockPerm) {
    Utilities.fillBlock(
      airBlockPerm,
      ARENA_X_OFFSET - ARENA_X_SIZE / 2 + 1,
      ARENA_Y_OFFSET,
      ARENA_Z_OFFSET - ARENA_Z_SIZE / 2 + 1,
      ARENA_X_OFFSET + ARENA_X_SIZE / 2 - 1,
      ARENA_Y_OFFSET + 10,
      ARENA_Z_OFFSET + ARENA_Z_SIZE / 2 - 1
    );
  }
  if (cobblestoneBlockPerm) {
    Utilities.fourWalls(
      cobblestoneBlockPerm,
      ARENA_X_OFFSET - ARENA_X_SIZE / 2,
      ARENA_Y_OFFSET,
      ARENA_Z_OFFSET - ARENA_Z_SIZE / 2,
      ARENA_X_OFFSET + ARENA_X_SIZE / 2,
      ARENA_Y_OFFSET + 10,
      ARENA_Z_OFFSET + ARENA_Z_SIZE / 2
    );
  }
  world2.sendMessage("BREAK THE WEB");
}
function gameTick() {
  try {
    curTick++;
    if (curTick === START_TICK) {
      initializeBreakTheWeb();
    }
    if (curTick > START_TICK && curTick % 20 === 0) {
      if (spawnCountdown > 0) {
        spawnCountdown--;
        if (spawnCountdown <= 0) {
          spawnNewWeb();
        }
      } else {
        checkForWeb();
      }
    }
    const spawnInterval = Math.ceil(200 / ((score + 1) / 3));
    if (curTick > START_TICK && curTick % spawnInterval === 0) {
      spawnMobs();
    }
    if (curTick > START_TICK && curTick % 29 === 0) {
      addFuzzyLeaves();
    }
  } catch (e) {
    console.warn("Tick error: " + e);
  }
  system.run(gameTick);
}
function spawnNewWeb() {
  const overworld = world2.getDimension("overworld");
  cottaX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
  cottaZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
  world2.sendMessage("Creating new web!");
  let block = overworld.getBlock({ x: cottaX + ARENA_X_OFFSET, y: 1 + ARENA_Y_OFFSET, z: cottaZ + ARENA_Z_OFFSET });
  if (block) {
    block.setPermutation(BlockPermutation2.resolve("minecraft:web"));
  }
}
function checkForWeb() {
  const overworld = world2.getDimension("overworld");
  let block = overworld.getBlock({ x: cottaX + ARENA_X_OFFSET, y: 1 + ARENA_Y_OFFSET, z: cottaZ + ARENA_Z_OFFSET });
  if (block && !block.permutation.matches("minecraft:web")) {
    score++;
    spawnCountdown = 2;
    cottaX = -1;
    let players = world2.getAllPlayers();
    for (let player of players) {
      player.runCommand("scoreboard players set @s score " + score);
    }
    world2.sendMessage("You broke the web! Creating new web in a few seconds.");
    cottaZ = -1;
  }
}
function spawnMobs() {
  const overworld = world2.getDimension("overworld");
  let spawnMobCount = Math.floor(Math.random() * 2) + 1;
  for (let j = 0; j < spawnMobCount; j++) {
    let zombieX = Math.floor(Math.random() * (ARENA_X_SIZE - 2)) - ARENA_X_SIZE / 2;
    let zombieZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 2)) - ARENA_Z_SIZE / 2;
    overworld.spawnEntity("minecraft:zombie", {
      x: zombieX + ARENA_X_OFFSET,
      y: 1 + ARENA_Y_OFFSET,
      z: zombieZ + ARENA_Z_OFFSET
    });
  }
}
function addFuzzyLeaves() {
  const overworld = world2.getDimension("overworld");
  for (let i = 0; i < 10; i++) {
    const leafX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
    const leafY = Math.floor(Math.random() * 10);
    const leafZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
    overworld.getBlock({ x: leafX + ARENA_X_OFFSET, y: leafY + ARENA_Y_OFFSET, z: leafZ + ARENA_Z_OFFSET })?.setPermutation(BlockPermutation2.resolve("minecraft:leaves"));
  }
}
system.run(gameTick);

//# sourceMappingURL=../debug/main.js.map
