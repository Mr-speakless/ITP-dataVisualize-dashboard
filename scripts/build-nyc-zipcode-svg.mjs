// One-off: turn NYC DOHMH's public MODZCTA_2010 boundaries (WGS84 lon/lat,
// the same "nyc-data" source the dashboard warehouse was built from) into a
// lean SVG whose <path> elements carry id="<MODZCTA>" — matching the zipcode
// c_ref values at drill level 5.
//   node scripts/build-nyc-zipcode-svg.mjs <in.geojson> <out.svg>
import { readFileSync, writeFileSync } from 'node:fs'

const [, , inPath = '/tmp/modzcta.geojson', outPath = 'src/assets/NycZipcodesMap.svg'] =
  process.argv

const VIEW_WIDTH = 1000
const SIMPLIFY_TOLERANCE_DEG = 0.00035 // ~30m at NYC latitude
const MIN_RING_AREA_DEG2 = 2e-7 // drop slivers/holes, keep real parcels
const LAT0 = 40.7 // x-scale reference latitude (equirectangular)

const geo = JSON.parse(readFileSync(inPath, 'utf8'))

function ringArea(points) {
  let area = 0
  for (let i = 0, n = points.length, j = n - 1; i < n; j = i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1])
  }
  return Math.abs(area) / 2
}

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

const cosLat0 = Math.cos((LAT0 * Math.PI) / 180)
let minX = Infinity
let minY = Infinity
let maxX = -Infinity
let maxY = -Infinity
const zipRings = new Map()

for (const feature of geo.features) {
  const zip = feature.properties.MODZCTA ?? feature.properties.modzcta
  if (!zip) continue

  const polygons =
    feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates
      : [feature.geometry.coordinates]
  const rings = []

  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (ringArea(ring) < MIN_RING_AREA_DEG2) continue
      const simplified = simplify(ring, SIMPLIFY_TOLERANCE_DEG)
      if (simplified.length < 4) continue
      const projected = simplified.map(([lon, lat]) => [lon * cosLat0, lat])
      for (const [x, y] of projected) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
      rings.push(projected)
    }
  }

  if (rings.length) {
    const existing = zipRings.get(zip) ?? []
    zipRings.set(zip, existing.concat(rings))
  }
}

const scale = VIEW_WIDTH / (maxX - minX)
const viewHeight = Math.round((maxY - minY) * scale)
const project = ([x, y]) =>
  `${((x - minX) * scale).toFixed(1)},${((maxY - y) * scale).toFixed(1)}`

const paths = [...zipRings.keys()]
  .sort()
  .map((zip) => {
    const d = zipRings
      .get(zip)
      .map((ring) => `M${ring.map(project).join('L')}Z`)
      .join('')
    return `  <path id="${zip}" name="${zip}" d="${d}" />`
  })
  .join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_WIDTH} ${viewHeight}">
${paths}
</svg>
`

writeFileSync(outPath, svg)
console.log(
  `wrote ${outPath} (${(svg.length / 1024).toFixed(1)} KB, ${zipRings.size} zipcodes, ` +
    `viewBox 0 0 ${VIEW_WIDTH} ${viewHeight})`
)
