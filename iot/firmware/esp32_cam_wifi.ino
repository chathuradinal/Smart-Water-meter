/*
  =============================================================================
  AquaMeter AI - ESP32-CAM Live Stream + Automatic HTTP Image Uploader
  Board: AI-Thinker ESP32-CAM
  Camera: OV2640

  FEATURES:
  1. Live MJPEG stream: http://ESP32_IP:81/stream
  2. Single JPEG capture: http://ESP32_IP/capture
  3. Device status: http://ESP32_IP/
  4. Automatic backend upload every 15 seconds
  5. Automatic Wi-Fi reconnection
  6. GPIO 4 Flash LED support

  HTTP ENDPOINTS:
  ESP32 port 80  -> Dashboard / Capture
  ESP32 port 81  -> Live video stream
  Backend port 5001 -> /api/camera/upload
  =============================================================================
*/

#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_http_server.h"

// =====================================================
// 1. WIFI CONFIGURATION
// =====================================================

const char* WIFI_SSID = "SLT-4G_1EEBBD";
const char* WIFI_PASSWORD = "EDFA2617";

// =====================================================
// 2. BACKEND CONFIGURATION
// =====================================================

// IMPORTANT: Replace with the actual backend laptop IP
const char* BACKEND_SERVER_IP = "192.168.1.107";

const int BACKEND_SERVER_PORT = 5001;

const char* DEVICE_ID = "ESP32_METER_01";

const unsigned long UPLOAD_INTERVAL_MS = 300000;

// =====================================================
// 3. AI THINKER ESP32-CAM PIN CONFIGURATION
// =====================================================

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_LED_PIN      4

// Set false if you do not need flash illumination
const bool USE_FLASH = true;

// =====================================================
// 4. HTTP SERVER CONFIGURATION
// =====================================================

httpd_handle_t capture_httpd = NULL;
httpd_handle_t stream_httpd = NULL;

#define PART_BOUNDARY "123456789000000000000987654321"

static const char* STREAM_CONTENT_TYPE =
  "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;

static const char* STREAM_BOUNDARY =
  "\r\n--" PART_BOUNDARY "\r\n";

static const char* STREAM_PART =
  "Content-Type: image/jpeg\r\n"
  "Content-Length: %u\r\n\r\n";

unsigned long lastUploadTime = 0;
unsigned long lastWiFiCheck = 0;

// =====================================================
// 5. CAMERA INITIALIZATION
// =====================================================

bool setupCamera() {

  Serial.println("[CAM] Configuring OV2640...");

  camera_config_t config = {};

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  // Use the same SCCB configuration as your working code
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {

    Serial.println("[CAM] PSRAM detected!");

    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;
    config.fb_location = CAMERA_FB_IN_PSRAM;
    config.grab_mode = CAMERA_GRAB_LATEST;

  } else {

    Serial.println("[CAM] PSRAM not detected!");

    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  }

  Serial.println("[CAM] Initializing camera...");

  esp_err_t err = esp_camera_init(&config);

  if (err != ESP_OK) {

    Serial.printf(
      "[CAM ERROR] Initialization failed: 0x%x\n",
      err
    );

    return false;
  }

  Serial.println("[CAM SUCCESS] OV2640 initialized!");

  return true;
}

// =====================================================
// 6. CAPTURE SINGLE JPEG FRAME
// =====================================================

camera_fb_t* captureFrame() {

  if (USE_FLASH) {
    digitalWrite(FLASH_LED_PIN, HIGH);
    delay(150);
  }

  camera_fb_t* fb = esp_camera_fb_get();

  digitalWrite(FLASH_LED_PIN, LOW);

  if (!fb) {
    Serial.println("[CAM ERROR] Frame capture failed!");
    return NULL;
  }

  Serial.printf("[CAM] Captured JPEG: %u bytes\n", fb->len);

  return fb;
}

// =====================================================
// 7. SINGLE IMAGE CAPTURE HTTP HANDLER
// URL: http://ESP32_IP/capture
// =====================================================

static esp_err_t capture_handler(httpd_req_t* req) {

  Serial.println("[HTTP] Snapshot requested");

  camera_fb_t* fb = captureFrame();

  if (!fb) {
    httpd_resp_send_err(
      req,
      HTTPD_500_INTERNAL_SERVER_ERROR,
      "Camera capture failed"
    );

    return ESP_FAIL;
  }

  httpd_resp_set_type(req, "image/jpeg");

  httpd_resp_set_hdr(
    req,
    "Access-Control-Allow-Origin",
    "*"
  );

  httpd_resp_set_hdr(
    req,
    "Cache-Control",
    "no-store"
  );

  esp_err_t res = httpd_resp_send(
    req,
    (const char*)fb->buf,
    fb->len
  );

  esp_camera_fb_return(fb);

  return res;
}

// =====================================================
// 8. LIVE MJPEG STREAM HANDLER
// URL: http://ESP32_IP:81/stream
// =====================================================

static esp_err_t stream_handler(httpd_req_t* req) {

  Serial.println("[HTTP] Live stream client connected");

  esp_err_t res = httpd_resp_set_type(
    req,
    STREAM_CONTENT_TYPE
  );

  if (res != ESP_OK) {
    return res;
  }

  httpd_resp_set_hdr(
    req,
    "Access-Control-Allow-Origin",
    "*"
  );

  char part_buf[64];

  while (true) {

    camera_fb_t* fb = esp_camera_fb_get();

    if (!fb) {
      Serial.println("[STREAM ERROR] Camera capture failed");
      return ESP_FAIL;
    }

    // Send stream boundary
    res = httpd_resp_send_chunk(
      req,
      STREAM_BOUNDARY,
      strlen(STREAM_BOUNDARY)
    );

    // Send JPEG headers
    if (res == ESP_OK) {

      size_t hlen = snprintf(
        part_buf,
        sizeof(part_buf),
        STREAM_PART,
        fb->len
      );

      res = httpd_resp_send_chunk(
        req,
        part_buf,
        hlen
      );
    }

    // Send JPEG frame
    if (res == ESP_OK) {

      res = httpd_resp_send_chunk(
        req,
        (const char*)fb->buf,
        fb->len
      );
    }

    esp_camera_fb_return(fb);

    if (res != ESP_OK) {
      Serial.println("[STREAM] Client disconnected");
      break;
    }
  }

  return res;
}

// =====================================================
// 9. DASHBOARD STATUS PAGE
// URL: http://ESP32_IP/
// =====================================================

static esp_err_t index_handler(httpd_req_t* req) {

  String html =
    "<!DOCTYPE html>"
    "<html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1'>"
    "<title>AquaMeter AI</title>"
    "</head>"
    "<body style='background:#050f21;color:white;"
    "font-family:Arial;text-align:center;padding:20px;'>"

    "<h2>AquaMeter AI Camera Node</h2>"

    "<p>Device: ESP32_METER_01</p>"

    "<p><a style='color:#00b4d8' href='/capture'>"
    "Capture Single Image</a></p>"

    "<p><a style='color:#00b4d8' "
    "href='http://" + WiFi.localIP().toString() +
    ":81/stream'>Open Live Stream</a></p>"

    "<p>Free Heap: " + String(ESP.getFreeHeap()) + " bytes</p>"

    "<img src='http://" + WiFi.localIP().toString() +
    ":81/stream' style='width:100%;max-width:640px'>"

    "</body></html>";

  httpd_resp_set_type(req, "text/html");

  return httpd_resp_send(
    req,
    html.c_str(),
    HTTPD_RESP_USE_STRLEN
  );
}

// =====================================================
// 10. START HTTP SERVERS
// PORT 80: Capture and dashboard
// PORT 81: Live streaming
// =====================================================

bool cameraServersRunning = false;

void startCameraServers() {

  if (cameraServersRunning) {
    return; // Guard: Prevent starting servers twice (fixes error 112 EADDRINUSE)
  }

  Serial.println("[HTTP] Starting camera servers...");

  // Server 1: Port 80
  httpd_config_t capture_config = HTTPD_DEFAULT_CONFIG();

  capture_config.server_port = 80;
  capture_config.ctrl_port = 32768;

  httpd_uri_t index_uri = {
    .uri = "/",
    .method = HTTP_GET,
    .handler = index_handler,
    .user_ctx = NULL
  };

  httpd_uri_t capture_uri = {
    .uri = "/capture",
    .method = HTTP_GET,
    .handler = capture_handler,
    .user_ctx = NULL
  };

  if (httpd_start(&capture_httpd, &capture_config) == ESP_OK) {

    httpd_register_uri_handler(capture_httpd, &index_uri);
    httpd_register_uri_handler(capture_httpd, &capture_uri);

    Serial.println("[HTTP] Capture server started on port 80");
    cameraServersRunning = true;

  } else {

    Serial.println("[HTTP ERROR] Capture server failed!");
  }

  // Server 2: Port 81
  httpd_config_t stream_config = HTTPD_DEFAULT_CONFIG();

  stream_config.server_port = 81;
  stream_config.ctrl_port = 32770;

  httpd_uri_t stream_uri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = stream_handler,
    .user_ctx = NULL
  };

  if (httpd_start(&stream_httpd, &stream_config) == ESP_OK) {

    httpd_register_uri_handler(stream_httpd, &stream_uri);

    Serial.println("[HTTP] Live stream server started on port 81");

  } else {

    Serial.println("[HTTP ERROR] Stream server failed!");
  }
}

// =====================================================
// 11. AUTOMATIC BACKEND IMAGE UPLOAD
// =====================================================

void uploadFrameToBackend() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("[WIFI] Offline. Upload skipped.");

    return;
  }

  Serial.println("\n[UPLOAD] Capturing meter image...");

  camera_fb_t* fb = captureFrame();

  if (!fb) {
    Serial.println("[UPLOAD ERROR] No camera frame!");
    return;
  }

  HTTPClient http;

  String endpoint =
    "http://" +
    String(BACKEND_SERVER_IP) +
    ":" +
    String(BACKEND_SERVER_PORT) +
    "/api/camera/upload";

  Serial.printf(
    "[HTTP] Uploading %u bytes to %s\n",
    fb->len,
    endpoint.c_str()
  );

  http.setConnectTimeout(5000);
  http.setTimeout(10000);

  if (http.begin(endpoint)) {

    http.addHeader("Content-Type", "image/jpeg");
    http.addHeader("X-Device-Id", DEVICE_ID);

    int responseCode = http.POST(
      fb->buf,
      fb->len
    );

    if (responseCode > 0) {

      String response = http.getString();

      Serial.printf(
        "[UPLOAD SUCCESS] HTTP %d\n",
        responseCode
      );

      Serial.println("[BACKEND] " + response);

    } else {

      Serial.printf(
        "[UPLOAD ERROR] %s\n",
        http.errorToString(responseCode).c_str()
      );
    }

    http.end();

  } else {

    Serial.println("[HTTP ERROR] Could not connect to backend");
  }

  esp_camera_fb_return(fb);

  Serial.println("[UPLOAD] Completed\n");
}

// =====================================================
// 12. WIFI CONNECTION
// =====================================================

void connectWiFi() {

  Serial.printf(
    "[WIFI] Connecting to %s\n",
    WIFI_SSID
  );

  WiFi.mode(WIFI_STA);

  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 40
  ) {

    delay(500);
    Serial.print(".");

    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("\n[WIFI SUCCESS] Connected!");

    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.print("[WIFI] Signal strength: ");
    Serial.println(WiFi.RSSI());

  } else {

    Serial.println("\n[WIFI ERROR] Connection timeout!");
  }
}

// =====================================================
// 13. SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(2000);

  Serial.println("\n\n=========================================");
  Serial.println("       AQUAMETER AI CAMERA NODE          ");
  Serial.println("=========================================");

  // Flash LED setup
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  // Step 1: Initialize camera
  Serial.println("\n[STEP 1] Camera initialization");

  if (!setupCamera()) {

    Serial.println("[FATAL] Camera initialization failed!");

    while (true) {
      delay(1000);
    }
  }

  Serial.println("[SUCCESS] Camera ready!");

  // Step 2: Connect Wi-Fi
  Serial.println("\n[STEP 2] Wi-Fi connection");

  connectWiFi();

  // Step 3: Start HTTP servers
  Serial.println("\n[STEP 3] Starting HTTP servers");

  if (WiFi.status() == WL_CONNECTED) {

    startCameraServers();

    Serial.println("\n=========================================");
    Serial.println("          AQUAMETER AI READY             ");
    Serial.println("=========================================");

    Serial.print("[CAMERA] Dashboard: http://");
    Serial.println(WiFi.localIP());

    Serial.print("[CAMERA] Capture: http://");
    Serial.print(WiFi.localIP());
    Serial.println("/capture");

    Serial.print("[CAMERA] Live stream: http://");
    Serial.print(WiFi.localIP());
    Serial.println(":81/stream");

  } else {

    Serial.println("[WARNING] HTTP servers not started: Wi-Fi offline.");
  }

  lastUploadTime = millis();
  lastWiFiCheck = millis();
}

// =====================================================
// 14. MAIN LOOP
// =====================================================

void loop() {

  // Reconnect Wi-Fi periodically if disconnected
  if (
    WiFi.status() != WL_CONNECTED &&
    millis() - lastWiFiCheck >= 10000
  ) {

    lastWiFiCheck = millis();

    Serial.println("[WIFI] Attempting reconnection...");

    WiFi.reconnect();
  }

  // Start servers once Wi-Fi becomes available (if not already started in setup)
  if (WiFi.status() == WL_CONNECTED && !cameraServersRunning) {
    startCameraServers();
    Serial.print("[WIFI] Camera available at: http://");
    Serial.println(WiFi.localIP());
  }

  // Automatic backend upload every 15 seconds
  if (
    millis() - lastUploadTime >= UPLOAD_INTERVAL_MS
  ) {

    lastUploadTime = millis();

    uploadFrameToBackend();
  }

  delay(10);
}
