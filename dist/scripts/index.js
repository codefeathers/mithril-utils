#!/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const shelljs_1 = require("shelljs");
const chokidar_1 = __importDefault(require("chokidar"));
const generateStylesheets_1 = __importDefault(require("./generateStylesheets"));
// Make Mithril happy
if (!global.window) {
    global.window = global.document = global.requestAnimationFrame = undefined;
}
const mithril_node_render_1 = __importDefault(require("mithril-node-render"));
const invalidate = (pred, cache) => {
    for (const key in cache) {
        if (pred(key))
            delete cache[key];
    }
};
const getTemplates = () => {
    const markup = path_1.resolve(__dirname, "..", "src/markup");
    invalidate(test => !test.startsWith(__dirname), require.cache);
    return require(markup);
};
const debounce = (t) => (f) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => f(...args), t);
    };
};
const tryCatch = (f) => {
    try {
        f();
    }
    catch (e) {
        console.error(e);
    }
};
const outDir = path_1.resolve(__dirname, "..", "docs");
const bob = ({ watch = false } = {}) => {
    const build = () => (console.log("Building src/markup..."),
        tryCatch(async () => {
            const { pages, stylesheets } = getTemplates();
            // clean outDir
            shelljs_1.rm("-rf", path_1.resolve(outDir, "css"));
            shelljs_1.rm(outDir + "/*.html");
            // create outDir for CSS
            shelljs_1.mkdir("-p", path_1.resolve(outDir, "css"));
            for (const [path, rootNode] of pages) {
                fs_1.writeFileSync(path_1.resolve(outDir, path), await mithril_node_render_1.default(rootNode));
            }
            for (const [path, css] of generateStylesheets_1.default(stylesheets)) {
                fs_1.writeFileSync(path_1.resolve(outDir, path), css);
            }
        }));
    if (watch) {
        console.log("Watching src/markup...");
        chokidar_1.default
            .watch(path_1.resolve(__dirname, "..", "src/markup"))
            .on("all", debounce(100)(build));
    }
    else
        build();
};
module.exports = { builder: bob };
if (require.main === module) {
    const watch = process.argv.includes("--watch") || process.argv.includes("-w");
    module.exports({ watch });
}
