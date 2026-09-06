// One-off: turn the public-domain NYC "nybb" borough boundaries (EPSG:2263,
// NY State Plane feet — already planar) into a lean SVG whose five <path>
// elements carry id="Bronx" ... id="Staten Island", matching the c_ref values
// the dashboard uses. Run: node scripts/build-nyc-borough-svg.mjs <in.geojson> <out.svg>
import { readFileSync, writeFileSync } from 'node:fs'

const [, , inPath = '/tmp/nybb.geojson', outPath = 'src/assets/NycBoroughsMap.svg'] = process.argv

const VIEW_WIDTH = 1000
const SIMPLIFY_TOLERANCE_FT = 120 // ~35m; keeps shape, kills vertex bloat
const MIN_RING_AREA_FT2 = 2_000_000 // drop pier/rock specks, keep real islands

const geo = JSON.parse(readFileSync(inPath, 'utf8'))

function ringArea(points) {
  let area = 0
  for (let i = 0, n = points.length, j = n - 1; i < n; j = i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1])
  }
  return Math.abs(area) / 2
}

// Perpendicular-distance Douglas–Peucker.
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const sqTol = tolerance * tolerance
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]

  while (stack.length) {
    const [first, last] = stack.pop()
    let maxSqDist = 0
    let index = -1
    const [ax, ay] = points[first]
    const [bx, by] = points[last]
    const dx = bx - ax
    const dy = by - ay
    const segLenSq = dx * dx + dy * dy || 1

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i]
      const t = ((px - ax) * dx + (py - ay) * dy) / segLenSq
      const cx = ax + t * dx
      const cy = ay + t * dy
      const sqDist = (px - cx) ** 2 + (py - cy) ** 2
      if (sqDist > maxSqDist) {
        maxSqDist = sqDist
        index = i
      }
    }

    if (maxSqDist > sqTol && index !== -1) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }

  return points.filter((_, i) => keep[i])
}

// Pass 1: collect kept rings per borough, track global bounds.
let minX = Infinity
let minY = Infinity
let maxX = -Infinity
let maxY = -Infinity
const boroughRings = new Map()

for (const feature of geo.features) {
  const name = feature.properties.BoroName
  const polygons =
    feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates
      : [feature.geometry.coordinates]
  const rings = []

  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (ringArea(ring) < MIN_RING_AREA_FT2) continue
      const simplified = simplify(ring, SIMPLIFY_TOLERANCE_FT)
      if (simplified.length < 4) continue
      for (const [x, y] of simplified) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
      rings.push(simplified)
    }
  }

  boroughRings.set(name, rings)
}

const spanX = maxX - minX
const spanY = maxY - minY
const scale = VIEW_WIDTH / spanX
const viewHeight = Math.round(spanY * scale)
const project = ([x, y]) => {
  const px = (x - minX) * scale
  const py = (maxY - y) * scale // flip: GeoJSON y is north-up, SVG is y-down
  return `${px.toFixed(1)},${py.toFixed(1)}`
}

const order = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island']
const paths = order
  .map((name) => {
    const d = boroughRings
      .get(name)
      .map((ring) => `M${ring.map(project).join('L')}Z`)
      .join('')
    return `  <path id="${name}" name="${name}" d="${d}" />`
  })
  .join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_WIDTH} ${viewHeight}">
${paths}
</svg>
`

writeFileSync(outPath, svg)
console.log(
  `wrote ${outPath} (${(svg.length / 1024).toFixed(1)} KB, viewBox 0 0 ${VIEW_WIDTH} ${viewHeight})`
)
