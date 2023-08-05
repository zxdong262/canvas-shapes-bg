interface Obj {
  [key: string]: any
}

interface Options {
  shapesPool?: string[],
  colorPool?: string[],
  shapeCount?: number,
  interval?: number,
  step?: number,
  minSize?: number,
  maxSize?: number
}

class CanvasShapesBg {
  observer: ResizeObserver | null = null
  dom: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  timerHandle: any
  intervalHandle: any
  shapesPool: string[] = ['star']
  shapes: any[] = []
  actionCount: number = 0
  width: number = 20
  height: number = 20
  shapeCount: number = 20
  interval: number = 100
  step: number = 3
  minSize: number = 50
  maxSize: number = 150
  colorRed = 'rgba(207,13,31,.25)'
  colorPool: string[] = [
    'rgba(156,183,52,.25)',
    'rgba(227,163,26,.25)',
    'rgba(217,84,56,.25)',
    'rgba(4,80,150,.25)',
    'rgba(122,24,105,.25)',
  ]

  constructor (_element: HTMLCanvasElement | undefined | Options, _options: Options | undefined) {
    const element = _element instanceof HTMLCanvasElement
      ? _element
      : this.createElement()
    const options = ((_element instanceof Option ? _element : _options) || {}) as Options
    Object.assign(this, options)
    this.dom = element
    element.setAttribute('width', element.offsetWidth.toString())
    element.setAttribute('height', element.offsetHeight.toString())
    this.ctx = element.getContext('2d') as CanvasRenderingContext2D
    this.width = element.width
    this.height = element.height
    this.watch()
  }

  createElement () {
    const canvas = document.createElement('canvas')
    // Set canvas size to match the window inner size
    canvas.setAttribute('width', window.innerWidth.toString())
    canvas.setAttribute('height', window.innerHeight.toString())
    // Set canvas position to absolute
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    // Append the canvas to the body
    document.body.appendChild(canvas)
    return canvas
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
  
    return function debouncedFunction(...args: Parameters<T>) {
      clearTimeout(timeoutId)
  
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay)
    };
  }


  handleCanvasDimensionChange (entries: Obj[]) {
    const { dom } = this
    for (const entry of entries) {
      if (entry.target === dom) {
        // Get the new offsetWidth and offsetHeight when the canvas size changes
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        this.width = newWidth
        this.height = newHeight
        dom.setAttribute('width', newWidth.toString())
        dom.setAttribute('height', newHeight.toString())
        this.stop()
        this.start(this.shapeCount)
      }
    }
  }

  watch () {
    if (this.dom) {
      const observer = new ResizeObserver(
        this.debounce(this.handleCanvasDimensionChange.bind(this), 1000)
      )
      observer.observe(this.dom)
      this.observer = observer
    }
  }

  destroy () {
    this.observer?.unobserve(this.dom)
    this.observer?.disconnect()
  }

  start (count: number = this.shapeCount) {
    this.buildShapes(count)
    this.animate()
  }

  animate () {
    this.loop()
  }

  stop () {
    clearTimeout(this.intervalHandle)
    this.clearShapes()
    this.shapes = []
  }

  clearShapes () {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  loop () {
    this.renderShapes()
    this.move()
    this.intervalHandle = setTimeout(this.loop.bind(this), this.interval)
  
  }

  renderShapes () {
    const { shapes } = this
    this.clearShapes()
    for(let i = 0, len = shapes.length;i < len;i ++) {
      const obj = shapes[i]
      const type = obj.type
      ;(this as any)['draw' + this.capitalizeString(type)](obj)
    }
  
  }

  buildPosArrayFromText(_text: string, _options?: Obj): Obj[] {
    const th = this
    const ctx = th.ctx
    const w = th.width
    const h = th.height
    const text = _text
    const options = _options || {}

    const shapeSize = options.shapeSize || 20
    const scanDistance = options.scanDistance || 5
    const fontSize = options.fontSize || 200
    const fontFamily = options.fontFamily || 'sans-serif'
    const top = options.top || 20

    // Supports any of the following values:
    // start end left right center
    ctx.textAlign = options.textAlign || 'start'

    // Supports any of the following values:
    // top hanging middle alphabetic ideographic bottom
    ctx.textBaseline = options.textBaseline || 'top'

    th.clearShapes()

    ctx.font = fontSize + 'px ' + fontFamily
    ctx.fillStyle = 'red'
    ctx.fillText(text, 20, top)

    const data = ctx.getImageData(0, 0, w, h)
    const dataObj = data.data
    const arr: Obj[] = []

    for (let i = 0; i < w; i += scanDistance) {
      for (let j = 0; j < h; j += scanDistance) {
        const point = j * w + i
        const dataPoint = dataObj[point * 4];
        if (dataPoint) {
          arr.push({ x: i, y: j })
        }
      }
    }
    th.clearShapes()
    return arr
  }

  moveTo(_targetArr: Obj [], _options?: Obj): void {
    const th = this
    const shapes = th.shapes
    const tarr = _targetArr
    const res: Obj[] = []
    const options = _options || {}
    let speed = options.speed
    speed = !speed || speed > 1 || speed <= 0 ? 0.5 : speed
    for (let i = 0, len = shapes.length; i < len; i++) {
      const pos = shapes[i]
      const tpos = tarr[i]
      const tx = (pos.x + tpos.x) * speed
      const ty = (pos.y + tpos.y) * speed
      res.push({ ...pos, x: tx, y: ty })
    }
    th.shapes = res
  }

  move () {
    const {
      shapes,
      step
    } = this
    const res = []
    for(let i = 0, len = shapes.length;i < len;i ++) {
      const pos = shapes[i]
      const ratio = pos.directionY / pos.directionX
      const { r } = pos

      let tx = pos.x + pos.directionX * step
      let ty = pos.y + pos.directionY * step
      const ex = tx > pos.r? tx - (this.width - pos.r) : pos.r - tx
      const ey = ty > pos.r? ty - (this.height - pos.r) : pos.r - ty
      let disx = 0
      let disy = 0
  
      if(ex > 0 && ey > 0) {
        if(ex > ey) {
          ty = ty > pos.r? this.height - pos.r: r
          disy = ty - pos.y
          disx = disy / pos.directionY * pos.directionX
          tx = pos.x + disx
          pos.directionY = - pos.directionY
        }
        else {
          tx = tx > pos.r? this.width - pos.r: r
          disx = tx - pos.x
          disy = disx / pos.directionX * pos.directionY
          ty = pos.y + disy
          pos.directionX = - pos.directionX
        }
      } else if(ex > 0) {
        tx = tx > pos.r? this.width - pos.r: r
        disx = tx - pos.x
        disy = disx / pos.directionX * pos.directionY
        ty = pos.y + disy
        pos.directionX = - pos.directionX
      } else if(ey > 0) {
        ty = ty > pos.r? this.height - pos.r: r
        disy = ty - pos.y
        disx = disy / pos.directionY * pos.directionX
        tx = pos.x + disx
        pos.directionY = - pos.directionY
      }
      pos.x = tx
      pos.y = ty
      res.push(pos)
    }
    this.shapes = res
  }

  capitalizeString (str: string) {
    if (typeof str !== 'string' || str.length === 0) {
      return str
    }
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  getRandomColor () {
    const { colorPool } = this
    const clen = colorPool.length
    const cr = Math.floor(Math.random() * clen)
    return colorPool[cr]
  }

  buildShapes (_count: number, typesPool?: string[]) {
    const count = _count || this.shapeCount
    const shapesPool = typesPool || this.shapesPool
    const len = shapesPool.length
    let r: any
    for(let i = 0;i < count;i ++) {
      r = Math.floor(Math.random() * len)
      this.shapes.push(this.buildShape(shapesPool[r]))
    }
  }

  buildShape (type: string) {
    return (this as any)['buildShape' + this.capitalizeString(type)]()
  }

  popShape (count: number) {
    const len = this.shapes.length
    let _count = len < count ? len : count
    _count = len - _count
    this.shapes = this.shapes.slice(0, _count)
    this.shapeCount = this.shapeCount - count
  }

  pushShape (obj: Obj, typesPool?: string[]) {
    const shapesPool = typesPool || this.shapesPool
    const len = shapesPool.length
    const r = Math.floor(Math.random() * len)
    this.shapes.push({
      ...this.buildShape(shapesPool[r]),
      ...obj
    })
    this.shapeCount++
  }

  drawBubble (pos: Obj) {
    const { ctx } = this
    ctx.beginPath()
    ctx.fillStyle = pos.fillStyle
    ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2, true)
    ctx.fill()
    ctx.closePath()
  }

  drawBalloon (pos: Obj) {
    const { ctx } = this
    ctx.beginPath()
    ctx.fillStyle = pos.fillStyle
    ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2, true)
    ctx.fill()
    ctx.closePath()
  
    ctx.beginPath()
    ctx.moveTo(this.width / 2, this.height - 20)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = pos.strokeStyle
    ctx.stroke()
    ctx.closePath()
  }

  drawLight (pos: Obj) {
    const { ctx } = this
    ctx.beginPath()
    ctx.moveTo(20, 20)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = pos.strokeStyle
    ctx.stroke()
    ctx.closePath()
  }

  drawHeart(pos: Obj): void {
    const { ctx } = this
    const ratio = pos.r / 75
    const { x, y }  = pos
    const bx = x - pos.r
    const by = y - pos.r

    ctx.beginPath()
    ctx.fillStyle = pos.fillStyle
    ctx.moveTo(bx + 75 * ratio, by + 40 * ratio)
    ctx.bezierCurveTo(bx + 75 * ratio, by + 37 * ratio, bx + 70 * ratio, by + 25 * ratio, bx + 50 * ratio, by + 25 * ratio)
    ctx.bezierCurveTo(bx + 20 * ratio, by + 25 * ratio, bx + 20 * ratio, by + 62.5 * ratio, bx + 20 * ratio, by + 62.5 * ratio)
    ctx.bezierCurveTo(bx + 20 * ratio, by + 80 * ratio, bx + 40 * ratio, by + 102 * ratio, bx + 75 * ratio, by + 120 * ratio)
    ctx.bezierCurveTo(bx + 110 * ratio, by + 102 * ratio, bx + 130 * ratio, by + 80 * ratio, bx + 130 * ratio, by + 62.5 * ratio)
    ctx.bezierCurveTo(bx + 130 * ratio, by + 62.5 * ratio, bx + 130 * ratio, by + 25 * ratio, bx + 100 * ratio, by + 25 * ratio)
    ctx.bezierCurveTo(bx + 85 * ratio, by + 25 * ratio, bx + 75 * ratio, by + 37 * ratio, bx + 75 * ratio, by + 40 * ratio)
    ctx.fill()
    ctx.closePath()
  }

  drawStar(pos: Obj): void {
    let rot = Math.PI / 2 * 3
    const cx = pos.x
    const cy = pos.y
    const spike = pos.spike
    const step = Math.PI / spike
    const { ctx } = this
    const outerRadius = pos.outerR
    const innerRadius = pos.innerR
    let x, y

    if (pos.strokeStyle) {
      ctx.strokeStyle = pos.strokeStyle
    } else {
      ctx.fillStyle = pos.fillStyle
    }

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spike; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)

    if (pos.strokeStyle) {
      ctx.stroke()
    } else {
      ctx.fill()
    }
    ctx.closePath()
  }

  buildShapeBubble(color = this.getRandomColor()): Obj {
    const size = Math.floor(Math.random() * (this.maxSize - this.minSize)) + this.minSize
    const s2 = size * 2
    const xx = this.width > s2 ? this.width : s2 + 1
    const yy = this.height > s2 ? this.height : s2 + 1
    const x = size + Math.floor(Math.random() * (xx - s2))
    const y = size + Math.floor(Math.random() * (yy - s2))
    const directionX = (Math.floor(Math.random() * 7) - 3) / 3
    const directionY = (Math.floor(Math.random() * 7) - 3) / 3
    const obj: Obj = {
      x,
      y,
      r: size,
      directionX,
      directionY,
      type: 'bubble',
      fillStyle: color
    }
    return obj
  }

  buildShapeBalloon(color = this.getRandomColor()): Obj {
    const size = Math.floor(Math.random() * (this.maxSize - this.minSize)) + this.minSize
    const s2 = size * 2
    const xx = this.width > s2 ? this.width : s2 + 1
    const yy = this.height > s2 ? this.height : s2 + 1
    const x = size + Math.floor(Math.random() * (xx - s2))
    const y = size + Math.floor(Math.random() * (yy - s2))
    const directionX = (Math.floor(Math.random() * 7) - 3) / 3
    const directionY = (Math.floor(Math.random() * 7) - 3) / 3

    const obj: Obj = {
      x,
      y,
      r: size,
      directionX,
      directionY,
      type: 'balloon',
      strokeStyle: color,
      fillStyle: color
    }
    return obj
  }

  buildShapeLight(color = this.getRandomColor()): Obj {
    const size = Math.floor(Math.random() * (this.maxSize - this.minSize)) + this.minSize
    const s2 = size * 2
    const xx = this.width > s2 ? this.width : s2 + 1
    const yy = this.height > s2 ? this.height : s2 + 1
    const x = size + Math.floor(Math.random() * (xx - s2))
    const y = size + Math.floor(Math.random() * (yy - s2))
    const directionX = (Math.floor(Math.random() * 7) - 3) / 3
    const directionY = (Math.floor(Math.random() * 7) - 3) / 3

    const obj: Obj = {
      x,
      y,
      r: size,
      directionX,
      directionY,
      type: 'light',
      strokeStyle: color
    }
    return obj
  }

  //heart from https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
  buildShapeHeart (color = this.getRandomColor()): Obj {
    const size = Math.floor(Math.random() * (this.maxSize - this.minSize)) + this.minSize
    const s2 = size * 2
    const xx = this.width > s2 ? this.width : s2 + 1
    const yy = this.height > s2 ? this.height : s2 + 1
    const x = size + Math.floor(Math.random() * (xx - s2))
    const y = size + Math.floor(Math.random() * (yy - s2))
    const directionX = Math.random() * 2 - 1
    const directionY = Math.random() * 2 - 1
    const obj: Obj = {
      x,
      y,
      r: size,
      directionX,
      directionY,
      type: 'heart',
      fillStyle: color
    }

    return obj
  }

  buildShapeStar (color = this.getRandomColor()): Obj {
    const size = Math.floor(Math.random() * (this.maxSize - this.minSize)) + this.minSize
    const s2 = size * 2
    const xx = this.width > s2 ? this.width : s2 + 1
    const yy = this.height > s2 ? this.height : s2 + 1
    const x = size + Math.floor(Math.random() * (xx - s2))
    const y = size + Math.floor(Math.random() * (yy - s2))
    const directionX = Math.random() * 2 - 1
    const directionY = Math.random() * 2 - 1
    const spike = 5 + Math.floor(Math.random() * 5)
    const obj: Obj = {
      x,
      y,
      r: size,
      outerR: size,
      innerR: size / 2,
      spike,
      directionX,
      directionY,
      type: 'star'
    }

    if (spike === 5) {
      obj.fillStyle = this.colorRed
    } else {
      obj.strokeStyle = color
    }
    return obj
  }
}

export default CanvasShapesBg
