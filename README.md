# canvas-shapes-bg

Draw simple shapes moving animations in canvas as webpage background

## Load

### as esm module

```bash
npm i -D canvas-shapes-bg
```

```js
import CanvasShapesBg from 'canvas-shapes-bg'
```

### load from cdn

```html
<script src="https://unpkg.com/canvas-shapes-bg/dist/canvas-shapes-bg.min.js">
```

```js
const { CanvasShapesBg } = window
```

### Use

```html
<body>
<canvas id="ca" style="position: absolute;z-index:-1"></canvas>
<div id="content" style="position: relative;z-index:1"></div>
<body>
```

```js
import CanvasShapesBg from 'canvas-shapes-bg'
// or if load from cdn,
const { CanvasShapesBg } = window

function run() {
  const options = {
    shapeCount: 20, //how many shapes to draw, optional
    timer: 100, //render animation frame for every {timer} ms, optional
    step: 3, //animation step px, optional
    minSize: 50, //shape size min, optional
    maxSize: 150, //shape size max, optional
    shapesPool: ['star'], // what shape you want draw, inside there are 'star', 'bubble', 'heart', 'light', 'balloon', optional, default is ['star']
  }
  const shapesInst = new CanvasShapesBg(
    document.getElementById('ca'),
    options
  )

  //start animation
  shapesInst.start()

  //stop
  shapesInst.stop()

  //visit src/canvas-shapes-bg.js for more instance method

  //you can extend shape draw method
  Shapes.prototype.buildShapeMoon = function(){
    //...
  }
  Shapes.prototype.drawMoon = function(){
    //...
  }

  shapesInst.shapesPool = ['moon']

  //optional methods
  shapesInst.buildPosArrayFromText(text, options)
  shapesInst.moveTo(targetArr, options)

}
```

## LICENCE

MIT
