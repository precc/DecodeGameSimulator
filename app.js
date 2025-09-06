window.onload = 
function App() {
  const tiles = 6;
  const tileSize = 100; // px per tile (24 inches)
  const fieldOffsetX = 80;
  const fieldOffsetY = 80;
  const pxPerInch = tileSize / 24;

  const blue = '#2563eb';
  const red = '#ef4444';
  const purple = '#9333ea';
  const green = '#16a34a';

  const svg = document.getElementById("fieldSVG");

  function tileTopLeft(x, y) {
    const sx = fieldOffsetX + x * tileSize;
    const sy = fieldOffsetY + (tiles - 1 - y) * tileSize;
    return { sx, sy };
  }

  function drawGrid() {
    for (let i = 0; i <= tiles; i++) {
      let x = fieldOffsetX + i * tileSize;
      svg.appendChild(newLine(x, fieldOffsetY, x, fieldOffsetY + tiles * tileSize, "#94a3b8"));
      let y = fieldOffsetY + i * tileSize;
      svg.appendChild(newLine(fieldOffsetX, y, fieldOffsetX + tiles * tileSize, y, "#94a3b8"));
    }
  }

  function newLine(x1, y1, x2, y2, stroke, width = 2) {
    let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
    l.setAttribute("stroke", stroke);
    l.setAttribute("stroke-width", width);
    return l;
  }

  function newRect(x, y, w, h, fill, stroke, width = 2) {
    let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("x", x);
    r.setAttribute("y", y);
    r.setAttribute("width", w);
    r.setAttribute("height", h);
    if (fill) r.setAttribute("fill", fill);
    else r.setAttribute("fill", "none");
    if (stroke) {
      r.setAttribute("stroke", stroke);
      r.setAttribute("stroke-width", width);
    }
    return r;
  }

  function newCircle(cx, cy, r, fill, stroke) {
    let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx);
    c.setAttribute("cy", cy);
    c.setAttribute("r", r);
    if (fill) c.setAttribute("fill", fill);
    if (stroke) c.setAttribute("stroke", stroke);
    return c;
  }

  function newPolygon(points, fill, stroke, width = 2) {
    let p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    p.setAttribute("points", points.map(pt => pt.join(",")).join(" "));
    if (fill) p.setAttribute("fill", fill);
    else p.setAttribute("fill", "none");
    if (stroke) {
      p.setAttribute("stroke", stroke);
      p.setAttribute("stroke-width", width);
    }
    return p;
  }

  // === Field Elements ===

  function drawGoalTriangle(x, y, color, side) {
    const { sx, sy } = tileTopLeft(x, y);
    if (side === "blue") {
      let pts = [
        [sx, sy],
        [sx + tileSize, sy],
        [sx, sy + tileSize],
      ];
      svg.appendChild(newPolygon(pts, "none", color, 4));
    } else {
      let pts = [
        [sx, sy],
        [sx + tileSize, sy],
        [sx + tileSize, sy + tileSize],
      ];
      svg.appendChild(newPolygon(pts, "none", color, 4));
    }
  }

  function drawRamp(x, y, color, direction) {
    const rampWidth = 6 * pxPerInch;
    const rampLen = 2 * tileSize;
    const { sx, sy } = tileTopLeft(x, y);
    let pts;
    if (direction === "down-left") {
      pts = [
        [sx, sy + tileSize],
        [sx + rampWidth, sy + tileSize],
        [sx + rampWidth, sy + tileSize + rampLen],
        [sx, sy + tileSize + rampLen],
      ];
    } else {
      pts = [
        [sx + tileSize, sy + tileSize],
        [sx + tileSize - rampWidth, sy + tileSize],
        [sx + tileSize - rampWidth, sy + tileSize + rampLen],
        [sx + tileSize, sy + tileSize + rampLen],
      ];
    }
    svg.appendChild(newPolygon(pts, "none", color, 3));
  }

  function drawSecretTunnel(x, y, color, direction) {
    const tunnelWidth = 6 * pxPerInch;
    const tunnelLen = 2 * tileSize;
    const { sx, sy } = tileTopLeft(x, y);
    let pts;
    if (direction === "down-left") {
      pts = [
        [sx + tunnelWidth, sy + tileSize],
        [sx + tunnelWidth * 2, sy + tileSize],
        [sx + tunnelWidth * 2, sy + tileSize + tunnelLen],
        [sx + tunnelWidth, sy + tileSize + tunnelLen],
      ];
    } else {
      pts = [
        [sx + tileSize - tunnelWidth, sy + tileSize],
        [sx + tileSize - tunnelWidth * 2, sy + tileSize],
        [sx + tileSize - tunnelWidth * 2, sy + tileSize + tunnelLen],
        [sx + tileSize - tunnelWidth, sy + tileSize + tunnelLen],
      ];
    }
    svg.appendChild(newPolygon(pts, color, null, 0));
  }

  function drawLoadingZone(x, y, color) {
    const { sx, sy } = tileTopLeft(x, y);
    svg.appendChild(newRect(sx, sy, tileSize, tileSize, color));
  }

  function drawBaseZone(x, y, corner, color) {
    const { sx, sy } = tileTopLeft(x, y);
    const size = 18 * pxPerInch;
    let bx = sx, by = sy;
    if (corner === "right-bottom") {
      bx = sx + tileSize - size;
      by = sy + tileSize - size;
    }
    svg.appendChild(newRect(bx, by, size, size, null, color, 3));
  }

  function drawArtifacts(x, y, colors) {
    const { sx, sy } = tileTopLeft(x, y);
    const spacing = tileSize / (colors.length + 1);
    colors.forEach((c, i) => {
      let cx = sx - tileSize / 2 + tileSize + spacing * (i + 1);
      let cy = sy + tileSize / 2;
      svg.appendChild(newCircle(cx, cy, 12, c, "#000"));
    });
  }

  // === Draw everything ===
  drawGrid();
  drawGoalTriangle(0, 5, blue, "blue");
  drawGoalTriangle(5, 5, red, "red");

  drawRamp(0, 5, blue, "down-left");
  drawRamp(5, 5, red, "down-right");

  drawSecretTunnel(0, 3, blue, "down-left");
  drawSecretTunnel(5, 3, red, "down-right");

  drawLoadingZone(0, 0, red);
  drawLoadingZone(5, 0, blue);

  drawBaseZone(1, 1, "right-bottom", red);
  drawBaseZone(4, 1, "left-bottom", blue);

  drawArtifacts(0, 1, [purple, purple, green]);
  drawArtifacts(0, 2, [purple, green, purple]);
  drawArtifacts(0, 3, [green, purple, purple]);

  drawArtifacts(5, 1, [green, purple, purple]);
  drawArtifacts(5, 2, [purple, green, purple]);
  drawArtifacts(5, 3, [purple, purple, green]);
};

console.log("App.js loaded!");
