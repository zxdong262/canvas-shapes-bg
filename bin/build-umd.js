const fs = require('fs')
const { resolve } = require('path')

const cwd = process.cwd()

function run () {
  const pre = `;(function (root, factory) {
    root.CanvasShapesBg = factory();
  }(this, function () {`

  const after = 'return CanvasShapesBg}));'
  const p = resolve(cwd, 'dist/canvas-shapes-bg.js')
  let str = '' + fs.readFileSync(p, 'utf-8')
  str = str
    .replace('"use strict";', '')
    .replace('Object.defineProperty(exports, "__esModule", { value: true });', pre)
    .replace('exports.default = CanvasShapesBg;', '')
    .replace('module.exports = CanvasShapesBg;', after)
  fs.writeFileSync(p, str)
}

run()