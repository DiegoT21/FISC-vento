package com.fiscvento.campo.ui.theme

import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Paint
import android.graphics.Path
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import kotlin.math.hypot
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.random.Random
import kotlinx.coroutines.isActive

private data class Pt(val x: Float, val y: Float)
private data class Trace(val pts: List<Pt>, val cum: FloatArray, val len: Float)
private data class Pulse(val trace: Trace, var s: Float, val dir: Int, val speed: Float, val tail: Float)

/**
 * Placa de circuito en azul marino con pulsos cian, el mismo trazo animado
 * de Ubika x Congreso, en los colores del logo de FISC-vento.
 */
@Composable
fun CircuitBackground(modifier: Modifier = Modifier) {
    val sim = remember { CircuitSim() }
    var tick by remember { mutableIntStateOf(0) }
    LaunchedEffect(sim) {
        var last = System.nanoTime()
        while (isActive) {
            withFrameNanos { now ->
                val dt = ((now - last) / 1_000_000_000f).coerceIn(0f, 0.05f)
                last = now
                sim.step(dt)
                tick++
            }
        }
    }
    Canvas(modifier.fillMaxSize()) {
        @Suppress("UNUSED_VARIABLE")
        val frame = tick
        sim.ensure(size.width, size.height)
        sim.board?.let { drawImage(it) }
        val pulses = sim.pulses
        for (pulse in pulses) {
            val head = pulse.s.coerceIn(0f, pulse.trace.len)
            val steps = 10
            for (i in 0 until steps) {
                val s1 = head - pulse.dir * pulse.tail * (i / steps.toFloat())
                val s0 = head - pulse.dir * pulse.tail * ((i + 1) / steps.toFloat())
                if (pulse.dir == 1 && s1 < 0f) break
                if (pulse.dir == -1 && s1 > pulse.trace.len) break
                val a = pointAt(pulse.trace, s0)
                val b = pointAt(pulse.trace, s1)
                val alpha = ((1f - i / steps.toFloat()) * (1f - i / steps.toFloat()) * 0.9f)
                drawLine(
                    Corriente.copy(alpha = alpha),
                    Offset(a.x, a.y),
                    Offset(b.x, b.y),
                    strokeWidth = 2.2f,
                    cap = StrokeCap.Round,
                )
            }
            val hp = pointAt(pulse.trace, head)
            drawCircle(Corriente.copy(alpha = 0.28f), 7f, Offset(hp.x, hp.y))
            drawCircle(CorrienteCaliente, 2.2f, Offset(hp.x, hp.y))
        }
        for (flash in sim.flashes) {
            val k = (flash.age / 0.6f).coerceIn(0f, 1f)
            drawCircle(
                color = Corriente.copy(alpha = (1f - k) * 0.7f),
                radius = 4f + k * 12f,
                center = Offset(flash.x, flash.y),
                style = Stroke(width = 1.6f),
            )
        }
    }
}

private class Flash(val x: Float, val y: Float, var age: Float)

private class CircuitSim {
    var board: androidx.compose.ui.graphics.ImageBitmap? = null
    private var traces: List<Trace> = emptyList()
    private var width = 0f
    private var height = 0f
    val pulses = ArrayList<Pulse>()
    val flashes = ArrayList<Flash>()
    private val random = Random(7)

    fun ensure(w: Float, h: Float) {
        if (w < 8f || h < 8f) return
        if (kotlin.math.abs(w - width) < 2f && kotlin.math.abs(h - height) < 2f && board != null) return
        width = w
        height = h
        traces = generate(w, h, random)
        board = renderBoard(w.roundToInt(), h.roundToInt(), traces)
        pulses.clear()
    }

    fun step(dt: Float) {
        if (traces.isEmpty()) return
        val idle = pulses.count { it.speed < 300f }
        if (idle < 12 && random.nextFloat() < dt * 6f) spawn(false)
        val keep = ArrayList<Pulse>(pulses.size)
        for (pulse in pulses) {
            val previous = pulse.s
            pulse.s += pulse.dir * pulse.speed * dt
            val done = if (pulse.dir == 1) pulse.s >= pulse.trace.len + pulse.tail else pulse.s <= -pulse.tail
            val crossedEnd = pulse.dir == 1 && previous < pulse.trace.len && pulse.s >= pulse.trace.len
            val crossedStart = pulse.dir == -1 && previous > 0f && pulse.s <= 0f
            if (crossedEnd || crossedStart) {
                val p = pointAt(pulse.trace, if (pulse.dir == 1) pulse.trace.len else 0f)
                flashes.add(Flash(p.x, p.y, 0f))
            }
            if (!done) keep.add(pulse)
        }
        pulses.clear()
        pulses.addAll(keep)
        val alive = ArrayList<Flash>(flashes.size)
        for (flash in flashes) {
            flash.age += dt
            if (flash.age < 0.6f) alive.add(flash)
        }
        flashes.clear()
        flashes.addAll(alive)
    }

    private fun spawn(fast: Boolean) {
        val trace = traces[random.nextInt(traces.size)]
        if (trace.len < 90f) return
        val dir = if (random.nextBoolean()) 1 else -1
        val speed = if (fast) random.nextFloat() * 300f + 520f else random.nextFloat() * 110f + 120f
        val tail = min(if (fast) 170f else 110f, trace.len * 0.6f)
        pulses.add(Pulse(trace, if (dir == 1) 0f else trace.len, dir, speed, tail))
    }
}

private fun pointAt(trace: Trace, distance: Float): Pt {
    val s = distance.coerceIn(0f, trace.len)
    var i = 1
    while (i < trace.cum.size - 1 && trace.cum[i] < s) i++
    val a = trace.pts[i - 1]
    val b = trace.pts[i]
    val seg = (trace.cum[i] - trace.cum[i - 1]).takeIf { it > 0f } ?: 1f
    val k = (s - trace.cum[i - 1]) / seg
    return Pt(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)
}

private val Corriente = Color(0xFF46E0FF)
private val CorrienteCaliente = Color(0xFFF4FDFF)
private const val PLACA = "#041C36"
private const val PISTA = "#1A4E78"
private const val PASTILLA = "#2A6A9E"

private val dirs = arrayOf(
    1 to 0, 1 to 1, 0 to 1, -1 to 1, -1 to 0, -1 to -1, 0 to -1, 1 to -1,
)

private fun generate(w: Float, h: Float, random: Random): List<Trace> {
    val g = maxOf(18f, min(w, h) / 46f)
    val cols = (w / g).toInt() + 2
    val rows = (h / g).toInt() + 2
    val occ = BooleanArray(cols * rows)
    fun free(x: Int, y: Int) = x in 0 until cols && y in 0 until rows && !occ[y * cols + x]
    val traces = ArrayList<Trace>()
    var used = 0
    val target = (cols * rows * 0.28f).toInt()

    fun commit(cells: List<Pt>) {
        val pts = ArrayList<Pt>(cells.size)
        for (cell in cells) {
            occ[cell.y.toInt() * cols + cell.x.toInt()] = true
            pts.add(Pt((cell.x - 1f) * g + g / 2f, (cell.y - 1f) * g + g / 2f))
        }
        used += cells.size
        val cum = FloatArray(pts.size)
        for (i in 1 until pts.size) {
            cum[i] = cum[i - 1] + hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
        }
        traces.add(Trace(pts, cum, cum.last()))
    }

    fun walk(): List<Pt>? {
        var x = random.nextInt(cols)
        var y = random.nextInt(rows)
        if (!free(x, y)) return null
        var d = random.nextInt(4) * 2
        var left = random.nextInt(3, 13)
        var turns = 0
        var sign = 1
        val cells = ArrayList<Pt>()
        cells.add(Pt(x.toFloat(), y.toFloat()))
        val taken = HashSet<Int>()
        taken.add(y * cols + x)
        for (step in 0 until 64) {
            val (dx, dy) = dirs[d]
            val nx = x + dx
            val ny = y + dy
            if (!free(nx, ny) || taken.contains(ny * cols + nx)) break
            if (dx != 0 && dy != 0 && !free(nx, y) && !free(x, ny)) break
            x = nx
            y = ny
            cells.add(Pt(x.toFloat(), y.toFloat()))
            taken.add(y * cols + x)
            if (--left > 0) continue
            if (d % 2 != 0) {
                d = (d + sign + 8) % 8
                left = random.nextInt(3, 13)
                continue
            }
            if (++turns > 5) break
            sign = if (random.nextBoolean()) 1 else -1
            d = (d + sign + 8) % 8
            left = random.nextInt(1, 3)
        }
        return if (cells.size >= 6) cells else null
    }

    var attempt = 0
    while (attempt < 1800 && used < target) {
        attempt++
        val cells = walk() ?: continue
        commit(cells)
    }
    return traces
}

private fun renderBoard(w: Int, h: Int, traces: List<Trace>): androidx.compose.ui.graphics.ImageBitmap {
    val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = AndroidCanvas(bitmap)
    canvas.drawColor(android.graphics.Color.parseColor(PLACA))
    val trace = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        strokeWidth = 1.6f
        color = android.graphics.Color.parseColor(PISTA)
    }
    val path = Path()
    for (item in traces) {
        val first = item.pts.first()
        path.moveTo(first.x, first.y)
        for (p in item.pts.drop(1)) path.lineTo(p.x, p.y)
    }
    canvas.drawPath(path, trace)
    val pad = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.parseColor(PASTILLA) }
    val hole = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 1.4f
        color = android.graphics.Color.parseColor(PASTILLA)
    }
    val ground = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.parseColor(PLACA) }
    for (item in traces) {
        for (end in listOf(item.pts.first() to (item.len > 140f), item.pts.last() to true)) {
            val p = end.first
            if (end.second) {
                canvas.drawCircle(p.x, p.y, 3.6f, ground)
                canvas.drawCircle(p.x, p.y, 3.6f, hole)
            } else {
                canvas.drawCircle(p.x, p.y, 2.1f, pad)
            }
        }
    }
    return bitmap.asImageBitmap()
}
