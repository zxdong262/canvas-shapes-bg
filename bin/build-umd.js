const fs = require('fs')
const { resolve } = require('path')

const cwd = process.cwd()

function run () {
  const pre = `;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define([], factory);
    } else if (typeof module === 'object' && module.exports) {
      // Node. Does not work with strict CommonJS, but
      // only CommonJS-like environments that support module.exports,
      // like Node.
      module.exports = factory();
    } else {
      // Browser globals (root is window)
      root.CanvasShapesBg = factory();
    }
  }(typeof self !== 'undefined' ? self : this, function () {`

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