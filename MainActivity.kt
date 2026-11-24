package com.tugba.bloom

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets

/**
 * Hosts the offline-first Bloom web app inside a native WebView with file upload,
 * JSON backup export, safe-area inset handling, and Android back-button support.
 */
class MainActivity : ComponentActivity() {

  private lateinit var webView: WebView
  private var filePathCallback: ValueCallback<Array<Uri>>? = null
  private var pendingExportJson: String? = null

  private val fileChooserLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      val cb = filePathCallback
      filePathCallback = null
      if (cb == null) return@registerForActivityResult

      var uris: Array<Uri>? = null
      if (result.resultCode == Activity.RESULT_OK && result.data != null) {
        val data = result.data
        val clip = data?.clipData
        if (clip != null && clip.itemCount > 0) {
          uris = Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
        } else if (data?.data != null) {
          uris = arrayOf(data.data!!)
        }
      }
      cb.onReceiveValue(uris)
    }

  private val createDocumentLauncher =
    registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
      val json = pendingExportJson
      pendingExportJson = null
      if (uri != null && json != null) {
        try {
          contentResolver.openOutputStream(uri)?.use { out ->
            out.write(json.toByteArray(StandardCharsets.UTF_8))
          }
          Toast.makeText(this, "Yedek dosyası kaydedildi 💾", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
          Toast.makeText(this, "Yedek dosyası kaydedilemedi 😔", Toast.LENGTH_SHORT).show()
        }
      }
    }

  inner class BloomAndroidBridge {
    @JavascriptInterface
    fun exportBackup(filename: String, jsonContent: String) {
      runOnUiThread {
        pendingExportJson = jsonContent
        createDocumentLauncher.launch(filename)
      }
    }

    @JavascriptInterface
    fun httpRequest(
      reqId: String,
      method: String,
      urlStr: String,
      headersJson: String?,
      body: String?,
    ) {
      Thread {
        val resultJson = try {
          val url = URL(urlStr)
          val allowedHosts = setOf(
            "tr.openfoodfacts.org",
            "world.openfoodfacts.org",
            "search.openfoodfacts.org",
            "generativelanguage.googleapis.com",
          )
          if (!url.protocol.equals("https", ignoreCase = true) || url.host !in allowedHosts) {
            throw SecurityException("Host not allowed: ${url.host}")
          }
          val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = if (method.equals("POST", ignoreCase = true)) "POST" else "GET"
            connectTimeout = 10_000
            readTimeout = 25_000
            instanceFollowRedirects = true
            setRequestProperty("User-Agent", "BloomApp/1.0 (Android; Personal Wellness)")
            setRequestProperty("Accept", "application/json")
            if (!headersJson.isNullOrBlank()) {
              val hObj = JSONObject(headersJson)
              val keys = hObj.keys()
              while (keys.hasNext()) {
                val k = keys.next()
                setRequestProperty(k, hObj.optString(k))
              }
            }
            if (requestMethod == "POST" && body != null) {
              doOutput = true
              setRequestProperty("Content-Type", "application/json; charset=utf-8")
              outputStream.use { os ->
                os.write(body.toByteArray(StandardCharsets.UTF_8))
              }
            }
          }
          val code = conn.responseCode
          val stream = if (code in 200..299) conn.inputStream else (conn.errorStream ?: conn.inputStream)
          val text = stream?.use { s ->
            BufferedReader(InputStreamReader(s, StandardCharsets.UTF_8)).readText()
          } ?: ""
          conn.disconnect()
          JSONObject().apply {
            put("ok", code in 200..299)
            put("status", code)
            put("text", text)
          }.toString()
        } catch (e: Exception) {
          JSONObject().apply {
            put("ok", false)
            put("status", 0)
            put("error", e.message ?: e.javaClass.simpleName)
          }.toString()
        }
        runOnUiThread {
          if (!isFinishing && !isDestroyed && ::webView.isInitialized) {
            webView.evaluateJavascript(
              "window.__bloomHttpDone && window.__bloomHttpDone(${JSONObject.quote(reqId)}, ${JSONObject.quote(resultJson)})",
              null,
            )
          }
        }
      }.start()
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.light(
        AndroidColor.parseColor("#FCEAF1"),
        AndroidColor.parseColor("#FCEAF1"),
      ),
      navigationBarStyle = SystemBarStyle.light(
        AndroidColor.WHITE,
        AndroidColor.WHITE,
      ),
    )

    val assetLoader = WebViewAssetLoader.Builder()
      .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
      .build()

    WebView.setWebContentsDebuggingEnabled(true)

    webView = WebView(this).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      )
      setBackgroundColor(AndroidColor.parseColor("#FFF8FA"))
      isVerticalScrollBarEnabled = true

      settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        databaseEnabled = true
        allowFileAccess = true
        allowContentAccess = true
        cacheMode = WebSettings.LOAD_DEFAULT
        mediaPlaybackRequiresUserGesture = false
      }

      addJavascriptInterface(BloomAndroidBridge(), "BloomAndroid")

      webViewClient = object : WebViewClient() {
        override fun shouldInterceptRequest(
          view: WebView,
          request: WebResourceRequest,
        ): WebResourceResponse? {
          return assetLoader.shouldInterceptRequest(request.url)
        }
      }

      webChromeClient = object : WebChromeClient() {
        override fun onShowFileChooser(
          webView: WebView?,
          filePathCallback: ValueCallback<Array<Uri>>?,
          fileChooserParams: FileChooserParams?,
        ): Boolean {
          this@MainActivity.filePathCallback?.onReceiveValue(null)
          this@MainActivity.filePathCallback = filePathCallback
          return try {
            val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
              addCategory(Intent.CATEGORY_OPENABLE)
              type = "*/*"
            }
            fileChooserLauncher.launch(intent)
            true
          } catch (_: Exception) {
            this@MainActivity.filePathCallback = null
            filePathCallback?.onReceiveValue(null)
            false
          }
        }
      }

      loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    val backCallback = object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        webView.evaluateJavascript("window.__bloomBack ? window.__bloomBack() : 'exit'") { raw ->
          if (raw?.trim('"') == "exit") {
            isEnabled = false
            onBackPressedDispatcher.onBackPressed()
            isEnabled = true
          }
        }
      }
    }
    onBackPressedDispatcher.addCallback(this, backCallback)

    setContent {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(Color(0xFFFFF8FA))
          .systemBarsPadding()
          .imePadding(),
      ) {
        AndroidView(
          factory = { webView },
          modifier = Modifier.fillMaxSize(),
        )
      }
    }
  }

  override fun onDestroy() {
    filePathCallback?.onReceiveValue(null)
    filePathCallback = null
    if (::webView.isInitialized) {
      webView.destroy()
    }
    super.onDestroy()
  }
}
