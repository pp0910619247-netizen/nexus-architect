package io.nexusarchitect.app

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import java.io.File

/**
 * หน้าจอดาวน์โหลด/ติดตั้ง AI model ลงเครื่องผู้ใช้
 *
 * Model ที่ถูกดาวน์โหลดแล้วจะถูกเก็บไว้ใน "internal files dir/ai_models"
 * เพื่อให้ WebView (หน้าเว็บ) หรือแอพสามารถใช้งานได้แบบออฟไลน์
 */
class DownloadModelActivity : AppCompatActivity() {

    private data class Model(
        val id: String,
        val name: String,
        val description: String,
        val fileName: String,
        val url: String,
        val sizeMb: Long
    )

    private val models = listOf(
        Model(
            "yuri-q4",
            "Yuri Nexus (Fast)",
            "Q4_K_M quantized · เบาและเร็ว เหมาะกับเครื่องทั่วไป/มือถือ (GGUF 378 MB)",
            "yuri-nexus-Q4_K_M.gguf",
            "https://pp0910619247-netizen.github.io/nexus-architect/models/yuri-nexus-Q4_K_M.gguf",
            378
        ),
        Model(
            "yuri-fp16",
            "Yuri Nexus (Full)",
            "FP16 คุณภาพสูงสุด · ต้องการ RAM & CPU แรง เหมาะกับเดสก์ท็อป (GGUF 1.1 GB)",
            "yuri-nexus.gguf",
            "https://pp0910619247-netizen.github.io/nexus-architect/models/yuri-nexus.gguf",
            1143
        )
    )

    private lateinit var modelList: LinearLayout
    private lateinit var downloadManager: DownloadManager
    private val downloadIds = HashMap<Long, String>() // downloadId -> model.id
    private val refreshRunnable = object : Runnable {
        override fun run() {
            refreshAll()
            modelList.postDelayed(this, 500)
        }
    }
    private var receiverRegistered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == DownloadManager.ACTION_DOWNLOAD_COMPLETE) {
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                val modelId = downloadIds.remove(id)
                if (modelId != null) {
                    moveToInternal(modelId, id)
                }
                refreshAll()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_download_model)
        modelList = findViewById(R.id.modelList)
        downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
        downloadIds.clear()

        registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
        receiverRegistered = true
    }

    override fun onResume() {
        super.onResume()
        modelList.post(refreshRunnable)
    }

    override fun onPause() {
        super.onPause()
        modelList.removeCallbacks(refreshRunnable)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (receiverRegistered) {
            unregisterReceiver(receiver)
            receiverRegistered = false
        }
    }

    // สร้าง UI ขึ้นมาใหม่ทุกครั้ง refresh (ง่ายและสอดคล้องกับจำนวนโค้ด)
    private fun refreshAll() {
        modelList.removeAllViews()
        for (m in models) {
            modelList.addView(renderModelCard(m))
        }
    }

    private fun renderModelCard(m: Model): View {
        val installed = isInstalled(m)
        val downloadedSize = downloadedSize(m)
        val isDownloading = downloadIds.values.contains(m.id)

        val card = LinearLayout(this)
        card.orientation = LinearLayout.VERTICAL
        card.setPadding(dp(16), dp(16), dp(16), dp(16))
        card.setBackgroundResource(R.drawable.bg_card)
        val lp = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        lp.setMargins(0, 0, 0, dp(14))
        card.layoutParams = lp

        // ชื่อ + สถานะ
        val titleRow = LinearLayout(this)
        titleRow.orientation = LinearLayout.HORIZONTAL
        titleRow.gravity = Gravity.CENTER_VERTICAL

        val nameTv = TextView(this)
        nameTv.text = m.name
        nameTv.textSize = 17f
        nameTv.setTypeface(nameTv.typeface, android.graphics.Typeface.BOLD)
        nameTv.setTextColor(0xFFF1F5F9.toInt())
        nameTv.layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        titleRow.addView(nameTv)

        val statusTv = TextView(this)
        statusTv.textSize = 13f
        statusTv.setTextColor(0xFFF59E0B.toInt())
        titleRow.addView(statusTv)

        // แถบ progress
        val bar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        bar.max = 100
        bar.progress = 0
        bar.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(6)
        )
        (bar.layoutParams as LinearLayout.LayoutParams).setMargins(0, dp(12), 0, 0)

        // คำอธิบาย
        val descTv = TextView(this)
        descTv.text = m.description
        descTv.textSize = 13f
        descTv.setTextColor(0xFF94A3B8.toInt())
        descTv.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        (descTv.layoutParams as LinearLayout.LayoutParams).setMargins(0, dp(10), 0, 0)
        descTv.visibility = if (installed || isDownloading) View.GONE else View.VISIBLE

        // ปุ่ม
        val btn = Button(this)
        btn.textSize = 14f
        btn.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(46)
        )
        (btn.layoutParams as LinearLayout.LayoutParams).setMargins(0, dp(14), 0, 0)

        when {
            isDownloading -> {
                statusTv.text = "กำลังดาวน์โหลด..."
                statusTv.setTextColor(0xFFF59E0B.toInt())
                btn.text = "กำลังดาวน์โหลด"
                btn.isEnabled = false
                btn.backgroundTintList = ContextCompat.getColorStateList(
                    this, android.R.color.darker_gray
                )
                progressFromDownloadManager(m, bar)
            }
            installed -> {
                statusTv.text = "ติดตั้งแล้ว"
                statusTv.setTextColor(0xFF10B981.toInt())
                btn.text = "ติดตั้งแล้ว"
                btn.isEnabled = false
                btn.backgroundTintList = ContextCompat.getColorStateList(
                    this, android.R.color.darker_gray
                )
                bar.visibility = View.GONE
            }
            else -> {
                statusTv.text = "${m.sizeMb} MB · ยังไม่ติดตั้ง"
                statusTv.setTextColor(0xFF64748B.toInt())
                btn.text = "ดาวน์โหลด"
                btn.setOnClickListener { startDownload(m) }
                bar.visibility = View.GONE
            }
        }

        card.addView(titleRow)
        card.addView(bar)
        card.addView(descTv)
        card.addView(btn)
        return card
    }

    private fun startDownload(m: Model) {
        val request = DownloadManager.Request(Uri.parse(m.url))
            .setTitle(m.name)
            .setDescription("กำลังดาวน์โหลด ${m.fileName}")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalFilesDir(
                applicationContext, Environment.DIRECTORY_DOWNLOADS, "ai_models/${m.fileName}"
            )
            .setAllowedOverMetered(true)
        try {
            val id = downloadManager.enqueue(request)
            downloadIds[id] = m.id
        } catch (_: Exception) {
            // ไม่มี URL/network ฯลฯ
        }
        refreshAll()
    }

    // เมื่อดาวน์โหลดเสร็จ ให้ย้ายจาก external downloads ไปยัง internal files (private กับแอพ)
    private fun moveToInternal(modelId: String, downloadId: Long) {
        val m = models.firstOrNull { it.id == modelId } ?: return
        val col = arrayOf(DownloadManager.COLUMN_LOCAL_URI)
        var src: File? = null
        try {
            val cursor: Cursor? = downloadManager.query(DownloadManager.Query().setFilterById(downloadId))
            cursor?.use { c ->
                if (c.moveToFirst()) {
                    val idx = c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)
                    if (idx >= 0) {
                        val uriStr = c.getString(idx)
                        src = if (uriStr.startsWith("file:")) {
                            File(Uri.parse(uriStr).path!!)
                        } else {
                            File(uriStr)
                        }
                    }
                }
            }
        } catch (_: Exception) {}
        if (src != null && src!!.exists()) {
            try {
                val dir = File(filesDir, "ai_models").apply { mkdirs() }
                val dst = File(dir, m.fileName)
                src!!.copyTo(dst, overwrite = true)
                src!!.delete()
            } catch (_: Exception) {}
        }
    }

    private fun isInstalled(m: Model): Boolean {
        return File(filesDir, "ai_models/${m.fileName}").exists()
    }

    private fun downloadedSize(m: Model): Long {
        val f = File(filesDir, "ai_models/${m.fileName}")
        return if (f.exists()) f.length() else 0L
    }

    private fun progressFromDownloadManager(m: Model, bar: ProgressBar) {
        for (id in downloadIds.keys) {
            if (downloadIds[id] == m.id) {
                try {
                    val cursor = downloadManager.query(DownloadManager.Query().setFilterById(id))
                    cursor?.use { c ->
                        if (c.moveToFirst()) {
                            val done = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                            val total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                            val pct = if (total > 0) ((done * 100) / total).toInt() else 0
                            bar.progress = pct
                        }
                    }
                } catch (_: Exception) {}
                break
            }
        }
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
