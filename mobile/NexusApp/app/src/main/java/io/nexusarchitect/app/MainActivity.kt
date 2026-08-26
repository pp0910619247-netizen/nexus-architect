package io.nexusarchitect.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private val SITE = "https://pp0910619247-netizen.github.io/nexus-architect/"
    private val HOST = "pp0910619247-netizen.github.io"
    private val MIC_REQ = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        web = findViewById(R.id.web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // ★ ความจำ Twin + model cache อยู่ที่นี่
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false   // ให้ไมค์ทำงานลื่น
            userAgentString = userAgentString + " NexusApp/1.0"
        }

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, req: WebResourceRequest): Boolean {
                val u = req.url
                // ลิงก์ภายในเว็บเรา → เปิดในแอป · ภายนอก → เปิด browser
                return if (u.host == HOST) false else openExternal(u)
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    request.grant(request.resources)   // ให้ mic/camera ของ WebView (KYC liveness)
                }
            }
        }

        askMicIfNeeded()
        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl(SITE)
    }

    private fun askMicIfNeeded() {
        val ok = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
                 PackageManager.PERMISSION_GRANTED
        if (!ok) ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), MIC_REQ)
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, res: IntArray) {
        super.onRequestPermissionsResult(code, perms, res)
        if (code == MIC_REQ) web.reload()
    }

    private fun openExternal(u: Uri): Boolean {
        try { startActivity(Intent(Intent.ACTION_VIEW, u)) } catch (_: Exception) {}
        return true
    }

    override fun onSaveInstanceState(outState: Bundle) { super.onSaveInstanceState(outState); web.saveState(outState) }
    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }
}
