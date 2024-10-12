import { world, system, BlockPermutation, ItemStack, DisplaySlotId, } from "@minecraft/server";
import Utilities from "./Utilities";
const START_TICK = 100;
const ARENA_X_SIZE = 30;
const ARENA_Z_SIZE = 30;
const ARENA_X_OFFSET = 0;
const ARENA_Y_OFFSET = -60;
const ARENA_Z_OFFSET = 0;
let score = 0;
let cottaX = 0;
let cottaZ = 0;
let spawnCountdown = 1;
// global variables
let curTick = 0;
function initializeBreakTheWeb() {
    const overworld = world.getDimension("overworld");
    let nightTime;
    let survival;
    nightTime = world.setTimeOfDay(13000);
    // survival = GameMode.survival;
    let scoreObjective = world.scoreboard.getObjective("score");
    if (!scoreObjective) {
        scoreObjective = world.scoreboard.addObjective("score", "Level");
    }
    // eliminate pesky nearby mobs
    let entities = overworld.getEntities({
        excludeTypes: ["player"],
    });
    for (let entity of entities) {
        entity.kill();
    }
    // set up scoreboard
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
        objective: scoreObjective,
    });
    const players = world.getAllPlayers();
    for (const player of players) {
        scoreObjective.setScore(player, 0);
        // feature: check to make sure player has "items" before giving new ones
        function checkInventory() {
            var _a, _b, _c;
            let inv = player.getComponent("inventory");
            let hasDiamondSword = false;
            let hasDirt = false;
            // Check inventory for items
            for (let i = 0; i < inv.inventorySize; i++) {
                let item = (_a = inv.container) === null || _a === void 0 ? void 0 : _a.getItem(i);
                if (item) {
                    if (item.typeId === "minecraft:diamond_sword") {
                        hasDiamondSword = true;
                    }
                    if (item.typeId === "minecraft:dirt") {
                        hasDirt = true;
                    }
                }
            }
            // Add items if they don't have them
            if (!hasDiamondSword) {
                (_b = inv.container) === null || _b === void 0 ? void 0 : _b.addItem(new ItemStack("minecraft:diamond_sword", 1));
            }
            // Always add a full stack of dirt if not present
            if (!hasDirt) {
                (_c = inv.container) === null || _c === void 0 ? void 0 : _c.addItem(new ItemStack("minecraft:dirt", 64));
            }
        }
        checkInventory();
        player.teleport({
            x: ARENA_X_OFFSET - 3,
            y: ARENA_Y_OFFSET,
            z: ARENA_Z_OFFSET - 3,
        }, {
            dimension: overworld,
            rotation: { x: 0, y: 0 },
        });
    }
    let airBlockPerm = BlockPermutation.resolve("minecraft:air");
    let cobblestoneBlockPerm = BlockPermutation.resolve("minecraft:mossy_cobblestone");
    if (airBlockPerm) {
        Utilities.fillBlock(airBlockPerm, ARENA_X_OFFSET - ARENA_X_SIZE / 2 + 1, ARENA_Y_OFFSET, ARENA_Z_OFFSET - ARENA_Z_SIZE / 2 + 1, ARENA_X_OFFSET + ARENA_X_SIZE / 2 - 1, ARENA_Y_OFFSET + 10, ARENA_Z_OFFSET + ARENA_Z_SIZE / 2 - 1);
    }
    if (cobblestoneBlockPerm) {
        Utilities.fourWalls(cobblestoneBlockPerm, ARENA_X_OFFSET - ARENA_X_SIZE / 2, ARENA_Y_OFFSET, ARENA_Z_OFFSET - ARENA_Z_SIZE / 2, ARENA_X_OFFSET + ARENA_X_SIZE / 2, ARENA_Y_OFFSET + 10, ARENA_Z_OFFSET + ARENA_Z_SIZE / 2);
    }
    world.sendMessage("BREAK THE WEB");
}
function gameTick() {
    try {
        curTick++;
        if (curTick === START_TICK) {
            initializeBreakTheWeb();
        }
        if (curTick > START_TICK && curTick % 20 === 0) {
            // no web exists, and we're waiting to spawn a new one.
            if (spawnCountdown > 0) {
                spawnCountdown--;
                if (spawnCountdown <= 0) {
                    spawnNewWeb();
                }
            }
            else {
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
    }
    catch (e) {
        console.warn("Tick error: " + e);
    }
    system.run(gameTick);
}
function spawnNewWeb() {
    const overworld = world.getDimension("overworld");
    // create new web
    cottaX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
    cottaZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
    world.sendMessage("Creating new web!");
    let block = overworld.getBlock({ x: cottaX + ARENA_X_OFFSET, y: 1 + ARENA_Y_OFFSET, z: cottaZ + ARENA_Z_OFFSET });
    if (block) {
        block.setPermutation(BlockPermutation.resolve("minecraft:web"));
    }
}
function checkForWeb() {
    const overworld = world.getDimension("overworld");
    let block = overworld.getBlock({ x: cottaX + ARENA_X_OFFSET, y: 1 + ARENA_Y_OFFSET, z: cottaZ + ARENA_Z_OFFSET });
    if (block && !block.permutation.matches("minecraft:web")) {
        // we didn't find the web! set a new spawn countdown
        score++;
        spawnCountdown = 2;
        cottaX = -1;
        let players = world.getAllPlayers();
        for (let player of players) {
            player.runCommand("scoreboard players set @s score " + score);
        }
        world.sendMessage("You broke the web! Creating new web in a few seconds.");
        cottaZ = -1;
    }
}
function spawnMobs() {
    const overworld = world.getDimension("overworld");
    // spawn mobs = create 1-2 mobs
    let spawnMobCount = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < spawnMobCount; j++) {
        let zombieX = Math.floor(Math.random() * (ARENA_X_SIZE - 2)) - ARENA_X_SIZE / 2;
        let zombieZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 2)) - ARENA_Z_SIZE / 2;
        overworld.spawnEntity("minecraft:zombie", {
            x: zombieX + ARENA_X_OFFSET,
            y: 1 + ARENA_Y_OFFSET,
            z: zombieZ + ARENA_Z_OFFSET,
        });
    }
}
function addFuzzyLeaves() {
    var _a;
    const overworld = world.getDimension("overworld");
    for (let i = 0; i < 10; i++) {
        const leafX = Math.floor(Math.random() * (ARENA_X_SIZE - 1)) - (ARENA_X_SIZE / 2 - 1);
        const leafY = Math.floor(Math.random() * 10);
        const leafZ = Math.floor(Math.random() * (ARENA_Z_SIZE - 1)) - (ARENA_Z_SIZE / 2 - 1);
        (_a = overworld
            .getBlock({ x: leafX + ARENA_X_OFFSET, y: leafY + ARENA_Y_OFFSET, z: leafZ + ARENA_Z_OFFSET })) === null || _a === void 0 ? void 0 : _a.setPermutation(BlockPermutation.resolve("minecraft:leaves"));
    }
}
system.run(gameTick);
//# sourceMappingURL=main.js.map