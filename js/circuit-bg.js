/**
 * Circuit etch background — sparse PCB routing on a grid.
 * 10 traces total, ≤3 etching at once, no overlapping segments.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.getElementById('circuit-bg');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var TOTAL = 10;
  var MAX_ACTIVE = 3;
  var TOP_COUNT = 3;

  var dpr = 1;
  var W = 0;
  var H = 0;
  var traces = [];
  var scrollProgress = 0;
  var displayProgress = 0;
  var rafId = 0;
  var needsRedraw = true;

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildCircuit();
    needsRedraw = true;
  }

  function pathLength(pts) {
    var len = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i].x - pts[i - 1].x;
      var dy = pts[i].y - pts[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function edgeKey(a, b) {
    var x1 = a.cx;
    var y1 = a.cy;
    var x2 = b.cx;
    var y2 = b.cy;
    if (x1 === x2) {
      return 'v:' + x1 + ':' + Math.min(y1, y2) + '-' + Math.max(y1, y2);
    }
    return 'h:' + y1 + ':' + Math.min(x1, x2) + '-' + Math.max(x1, x2);
  }

  function neighbors(node, cols, rows) {
    var list = [];
    if (node.cy + 1 < rows) list.push({ cx: node.cx, cy: node.cy + 1 }); // down preferred
    if (node.cx + 1 < cols) list.push({ cx: node.cx + 1, cy: node.cy });
    if (node.cx - 1 >= 0) list.push({ cx: node.cx - 1, cy: node.cy });
    // no upward moves — traces only go down / sideways
    return list;
  }

  /**
   * Greedy downward route on free grid edges.
   * Avoids reusing edges; keeps Manhattan spacing via cell size.
   */
  function routeOnGrid(start, goalY, cols, rows, occupied, rnd, cell, originX, originY) {
    var path = [start];
    var cur = { cx: start.cx, cy: start.cy };
    var guard = cols * rows;
    var visited = {};
    visited[cur.cx + ',' + cur.cy] = true;

    while (cur.cy < goalY && guard-- > 0) {
      var opts = neighbors(cur, cols, rows);
      var scored = [];

      for (var i = 0; i < opts.length; i++) {
        var n = opts[i];
        var key = n.cx + ',' + n.cy;
        if (visited[key]) continue;
        var ek = edgeKey(cur, n);
        if (occupied[ek]) continue;

        // Prefer down; slight random among free moves
        var score = 0;
        if (n.cy > cur.cy) score += 3;
        if (n.cy === cur.cy) score += 1;
        score += rnd() * 0.4;
        // Prefer staying away from left/right extremes unless started there
        score -= Math.abs(n.cx - start.cx) * 0.05;
        scored.push({ n: n, ek: ek, score: score });
      }

      if (!scored.length) break;

      scored.sort(function (a, b) {
        return b.score - a.score;
      });

      // Pick among top 2 for variety without chaos
      var pick = scored[Math.min(scored.length - 1, rnd() < 0.7 ? 0 : 1)];
      occupied[pick.ek] = true;
      visited[pick.n.cx + ',' + pick.n.cy] = true;
      cur = pick.n;
      path.push({
        cx: cur.cx,
        cy: cur.cy,
        x: originX + cur.cx * cell,
        y: originY + cur.cy * cell,
      });
    }

    return path;
  }

  function buildCircuit() {
    var rnd = mulberry32(107 + Math.floor(W / 70) * 11 + Math.floor(H / 70) * 23);
    traces = [];

    var cell = Math.max(56, Math.min(80, Math.round(Math.min(W, H) / 11)));
    var margin = cell;
    var originX = margin;
    var originY = margin;
    var cols = Math.max(6, Math.floor((W - margin * 2) / cell));
    var rows = Math.max(8, Math.floor((H - margin * 2) / cell));

    var occupied = {};
    var strokeW = Math.max(2.2, Math.min(3.4, 2.6));

    var startStep = 1 / (TOTAL + MAX_ACTIVE - 1);
    var etchSpan = MAX_ACTIVE * startStep;

    var usedStarts = {};

    for (var i = 0; i < TOTAL; i++) {
      var fromTop = i < TOP_COUNT;
      var start;
      var attempts = 0;
      var placed = false;

      while (attempts++ < 24 && !placed) {
        if (fromTop) {
          var cx = 1 + Math.floor(rnd() * (cols - 2));
          // keep horizontal separation between top starts
          var blocked = false;
          for (var dx = -1; dx <= 1; dx++) {
            if (usedStarts['t:' + (cx + dx)]) blocked = true;
          }
          if (blocked) continue;
          start = {
            cx: cx,
            cy: 0,
            x: originX + cx * cell,
            y: originY,
          };
          usedStarts['t:' + cx] = true;
        } else {
          var fromLeft = rnd() < 0.5;
          var cy = 1 + Math.floor(rnd() * Math.floor(rows * 0.45));
          var sk = (fromLeft ? 'l:' : 'r:') + cy;
          if (usedStarts[sk] || usedStarts[(fromLeft ? 'l:' : 'r:') + (cy - 1)] || usedStarts[(fromLeft ? 'l:' : 'r:') + (cy + 1)]) {
            continue;
          }
          start = {
            cx: fromLeft ? 0 : cols - 1,
            cy: cy,
            x: originX + (fromLeft ? 0 : cols - 1) * cell,
            y: originY + cy * cell,
          };
          usedStarts[sk] = true;
        }

        var goalY = Math.min(rows - 1, start.cy + 4 + Math.floor(rnd() * (rows - start.cy - 3)));
        var gridPath = routeOnGrid(start, goalY, cols, rows, occupied, rnd, cell, originX, originY);

        function rollbackPath(gp) {
          for (var p = 1; p < gp.length; p++) {
            delete occupied[edgeKey(gp[p - 1], gp[p])];
          }
          if (fromTop) delete usedStarts['t:' + start.cx];
          else delete usedStarts[(start.cx === 0 ? 'l:' : 'r:') + start.cy];
        }

        if (gridPath.length < 4) {
          rollbackPath(gridPath);
          continue;
        }

        var pts = gridPath.map(function (n) {
          return { x: n.x, y: n.y };
        });
        if (fromTop) {
          pts.unshift({ x: pts[0].x, y: -4 });
        } else if (start.cx === 0) {
          pts.unshift({ x: -4, y: pts[0].y });
        } else {
          pts.unshift({ x: W + 4, y: pts[0].y });
        }

        var len = pathLength(pts);
        if (len < cell * 3) {
          rollbackPath(gridPath);
          continue;
        }

        traces.push({
          pts: pts,
          len: len,
          width: strokeW * (0.95 + rnd() * 0.15),
          startAt: i * startStep,
          etchSpan: etchSpan,
        });
        placed = true;
      }
    }
  }

  function drawPartialPath(pts, drawLen) {
    if (drawLen <= 0) return null;
    var remaining = drawLen;
    var last = pts[0];
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    var tip = { x: last.x, y: last.y };

    for (var i = 1; i < pts.length; i++) {
      var next = pts[i];
      var dx = next.x - last.x;
      var dy = next.y - last.y;
      var seg = Math.sqrt(dx * dx + dy * dy);
      if (remaining >= seg) {
        ctx.lineTo(next.x, next.y);
        tip = next;
        remaining -= seg;
        last = next;
      } else {
        var t = remaining / seg;
        tip = { x: last.x + dx * t, y: last.y + dy * t };
        ctx.lineTo(tip.x, tip.y);
        break;
      }
    }
    ctx.stroke();
    return tip;
  }

  function drawVia(x, y, r) {
    ctx.fillStyle = 'rgba(20, 122, 101, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(10, 10, 15, 0.92)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function localProgress(tr, p) {
    return Math.max(0, Math.min(1, (p - tr.startAt) / Math.max(0.001, tr.etchSpan)));
  }

  function draw() {
    displayProgress += (scrollProgress - displayProgress) * 0.1;
    if (Math.abs(scrollProgress - displayProgress) < 0.0008) {
      displayProgress = scrollProgress;
    }

    ctx.clearRect(0, 0, W, H);

    // subtle alignment grid (routing lattice), not chaotic
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 122, 101, 0.035)';
    ctx.lineWidth = 1;
    var cell = Math.max(56, Math.min(80, Math.round(Math.min(W, H) / 11)));
    var margin = cell;
    ctx.beginPath();
    for (var gx = margin; gx < W - margin; gx += cell) {
      ctx.moveTo(gx, margin);
      ctx.lineTo(gx, H - margin);
    }
    for (var gy = margin; gy < H - margin; gy += cell) {
      ctx.moveTo(margin, gy);
      ctx.lineTo(W - margin, gy);
    }
    ctx.stroke();
    ctx.restore();

    var p = displayProgress;

    for (var i = 0; i < traces.length; i++) {
      var tr = traces[i];
      var local = localProgress(tr, p);
      if (local <= 0) continue;

      var isEtching = local < 1;
      var drawLen = tr.len * local;
      var alpha = isEtching ? 0.8 : 0.4;

      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.strokeStyle = 'rgba(20, 122, 101,' + (0.22 * alpha) + ')';
      ctx.lineWidth = tr.width + 1;
      drawPartialPath(tr.pts, drawLen);

      ctx.strokeStyle = 'rgba(61, 191, 154,' + (0.72 * alpha) + ')';
      ctx.lineWidth = tr.width;
      var tip = drawPartialPath(tr.pts, drawLen);

      if (tip && isEtching) {
        var tipR = Math.max(5, tr.width * 2.4);
        var grd = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, tipR * 2);
        grd.addColorStop(0, 'rgba(94, 234, 212, 0.85)');
        grd.addColorStop(1, 'rgba(61, 191, 154, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, tipR * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(236, 253, 245, 0.95)';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, Math.max(1.5, tr.width * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      if (local > 0.02) {
        drawVia(tr.pts[0].x, tr.pts[0].y, Math.max(2.2, tr.width));
      }
      if (local > 0.96) {
        var end = tr.pts[tr.pts.length - 1];
        drawVia(end.x, end.y, Math.max(2.2, tr.width));
      }
    }

    if (Math.abs(scrollProgress - displayProgress) > 0.0008 || needsRedraw) {
      needsRedraw = false;
      rafId = requestAnimationFrame(draw);
    } else {
      rafId = 0;
    }
  }

  function requestDraw() {
    if (!rafId) rafId = requestAnimationFrame(draw);
  }

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
    needsRedraw = true;
    requestDraw();
  }

  var resizeTimer = 0;
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        requestDraw();
      }, 120);
    },
    { passive: true }
  );

  window.addEventListener('scroll', onScroll, { passive: true });

  resize();
  onScroll();
  requestDraw();
})();
