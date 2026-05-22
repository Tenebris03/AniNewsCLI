"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTracked = loadTracked;
exports.saveTracked = saveTracked;
exports.isTracked = isTracked;
exports.addTrackedShow = addTrackedShow;
exports.removeTrackedShow = removeTrackedShow;
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const CONFIG_DIR = (0, node_path_1.resolve)((0, node_os_1.homedir)(), ".config", "aninews");
const CONFIG_PATH = (0, node_path_1.resolve)(CONFIG_DIR, "tracked.json");
function ensureConfig() {
    if (!(0, node_fs_1.existsSync)(CONFIG_DIR)) {
        (0, node_fs_1.mkdirSync)(CONFIG_DIR, { recursive: true });
    }
    if (!(0, node_fs_1.existsSync)(CONFIG_PATH)) {
        const empty = { tracked: {} };
        (0, node_fs_1.writeFileSync)(CONFIG_PATH, JSON.stringify(empty, null, 2), "utf-8");
        return empty;
    }
    const raw = (0, node_fs_1.readFileSync)(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
}
function loadTracked() {
    return ensureConfig().tracked;
}
function saveTracked(tracked) {
    const config = { tracked };
    (0, node_fs_1.writeFileSync)(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
function isTracked(mediaId) {
    const tracked = loadTracked();
    return mediaId in tracked;
}
function addTrackedShow(mediaId, title) {
    const tracked = loadTracked();
    tracked[mediaId] = {
        mediaId,
        title,
        addedAt: new Date().toISOString(),
    };
    saveTracked(tracked);
}
function removeTrackedShow(mediaId) {
    const tracked = loadTracked();
    delete tracked[mediaId];
    saveTracked(tracked);
}
