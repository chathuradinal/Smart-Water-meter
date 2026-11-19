/*
  IoT Smart Water Meter Retrofitting Firmware
  Target: AI-Thinker ESP32-CAM + SIM800L GSM Module
  Features:
  - OV2640 Dial Capture with Flash LED on GPIO 4
  - TensorFlow Lite Micro INT8 Digit Classification (0-9)
  - SIM800L Cellular Telemetry (UART: TX GPIO 15, RX GPIO 14)
  - Ultra-Low Power Deep Sleep (Configurable: 10 mins for leak surveillance / 6 hours)
  SRS Reference: FR-01, FR-02, FR-03, NFR-01, Section 5.1
*/

#include "esp_camera.h"
#include "camera_pins.h"
#include "model.h" // Generated INT8 model byte array

// TensorFlow Lite Micro Includes
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "tensorflow/lite/version.h"

// Hardware Pin Definitions for SIM800L
#define SIM_RX_PIN 14 // ESP32 RX from SIM800L TX
#define SIM_TX_PIN 15 // ESP32 TX to SIM800L RX (via 1k/2.2k voltage divider)

// Deep Sleep Interval: 10 minutes (600 seconds) for leak monitoring
// Or set to 21600 seconds (6 hours) per SRS NFR-01
#define SLEEP_INTERVAL_SECONDS 600 
#define uS_TO_S_FACTOR 1000000ULL

// Backend Cloud Endpoint
const char* SERVER_URL = "http://YOUR_SERVER_IP:5001/api/data";
const char* DEVICE_ID = "ESP32_METER_01";

// TFLite Micro Arena Setup (allocated in PSRAM)
constexpr int kTensorArenaSize = 64 * 1024;
uint8_t* tensor_arena = nullptr;

tflite::ErrorReporter* error_reporter = nullptr;
const tflite::Model* tflite_model = nullptr;
tflite::MicroInterpreter* interpreter = nullptr;
TfLiteTensor* model_input = nullptr;
TfLiteTensor* model_output = nullptr;

// Predefined Digit ROI Window Offsets across the 5 drum rollers
// (Adjust based on mechanical camera mount distance)
struct DigitROI {
  int x;
  int y;
  int w;
  int h;
};

// Digit 0-3: White drums (whole units), Digit 4: Red drum (fractional fastest drum #8)
const DigitROI DIGIT_ROIS[5] = {
  { 40,  55, 28, 28 },
  { 72,  55, 28, 28 },
  { 104, 55, 28, 28 },
  { 136, 55, 28, 28 },
  { 168, 55, 28, 28 }
};

bool initCamera() {
  camera_config_t config;
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
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_GRAYSCALE; // Direct grayscale for CNN input
  config.frame_size = FRAMESIZE_QVGA;        // 320x240
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  return (err == ESP_OK);
}

bool initTinyML() {
  // Allocate arena in PSRAM
  tensor_arena = (uint8_t*)ps_malloc(kTensorArenaSize);
  if (!tensor_arena) {
    tensor_arena = (uint8_t*)malloc(kTensorArenaSize);
  }
  if (!tensor_arena) return false;

  static tflite::MicroErrorReporter micro_error_reporter;
  error_reporter = &micro_error_reporter;

  tflite_model = tflite::GetModel(model_tflite);
  if (tflite_model->version() != TFLITE_SCHEMA_VERSION) {
    return false;
  }

  static tflite::AllOpsResolver resolver;
  static tflite::MicroInterpreter static_interpreter(
      tflite_model, resolver, tensor_arena, kTensorArenaSize, error_reporter);
  interpreter = &static_interpreter;

  if (interpreter->AllocateTensors() != kTfLiteOk) {
    return false;
  }

  model_input = interpreter->input(0);
  model_output = interpreter->output(0);
  return true;
}

int classifyDigitROI(camera_fb_t* fb, const DigitROI& roi) {
  // Extract and resize 28x28 ROI into model input tensor
  int8_t* input_buffer = model_input->data.int8;
  
  float scale_x = (float)roi.w / 28.0f;
  float scale_y = (float)roi.h / 28.0f;

  for (int y = 0; y < 28; y++) {
    for (int x = 0; x < 28; x++) {
      int src_x = roi.x + (int)(x * scale_x);
      int src_y = roi.y + (int)(y * scale_y);
      src_x = constrain(src_x, 0, fb->width - 1);
      src_y = constrain(src_y, 0, fb->height - 1);

      uint8_t pixel_val = fb->buf[src_y * fb->width + src_x];
      // Convert uint8 [0, 255] to quantized int8 [-128, 127]
      input_buffer[y * 28 + x] = (int8_t)((int)pixel_val - 128);
    }
  }

  if (interpreter->Invoke() != kTfLiteOk) {
    return -1;
  }

  // Find class with highest probability
  int best_digit = 0;
  int8_t max_score = model_output->data.int8[0];
  for (int d = 1; d < 10; d++) {
    if (model_output->data.int8[d] > max_score) {
      max_score = model_output->data.int8[d];
      best_digit = d;
    }
  }
  return best_digit;
}

void transmitTelemetrySIM800L(float reading) {
  HardwareSerial simSerial(1);
  simSerial.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
  delay(2000); // Allow SIM800L network handshake

  // Basic HTTP POST via AT Commands
  simSerial.println("AT+HTTPINIT");
  delay(1000);
  simSerial.println("AT+HTTPPARA=\"CID\",1");
  delay(500);
  simSerial.print("AT+HTTPPARA=\"URL\",\"");
  simSerial.print(SERVER_URL);
  simSerial.println("\"");
  delay(500);
  simSerial.println("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  delay(500);

  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"reading\":" + String(reading, 4) + "}";
  simSerial.print("AT+HTTPDATA=");
  simSerial.print(payload.length());
  simSerial.println(",10000");
  delay(500);
  simSerial.println(payload);
  delay(1000);

  simSerial.println("AT+HTTPACTION=1"); // 1 = POST
  delay(3000);
  simSerial.println("AT+HTTPTERM");
  delay(500);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n[ESP32-CAM] Waking from deep sleep...");

  // 1. Illuminate dial with Flash LED on GPIO 4
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(500); // Settle exposure

  // 2. Initialize Camera and capture dial frame
  if (!initCamera()) {
    Serial.println("Camera Init Failed!");
    digitalWrite(FLASH_LED_PIN, LOW);
  } else {
    camera_fb_t* fb = esp_camera_fb_get();
    digitalWrite(FLASH_LED_PIN, LOW); // Turn off flash immediately to conserve battery

    if (fb && initTinyML()) {
      int digits[5];
      Serial.print("Inferred Digits: ");
      for (int i = 0; i < 5; i++) {
        digits[i] = classifyDigitROI(fb, DIGIT_ROIS[i]);
        Serial.print(digits[i]);
      }
      Serial.println();

      // Combine into cubic meter reading (Digits 0-3 = units, Digit 4 = tenth)
      float reading = (digits[0] * 1000) + (digits[1] * 100) + (digits[2] * 10) + digits[3] + (digits[4] * 0.1f);
      esp_camera_fb_return(fb);

      // 3. Transmit via 2G Cellular Telemetry
      Serial.println("Transmitting telemetry over SIM800L...");
      transmitTelemetrySIM800L(reading);
    }
  }

  // 4. Enter Deep Sleep (10 minutes for leak surveillance / 6 hours standard)
  Serial.printf("Entering deep sleep for %d seconds...\n", SLEEP_INTERVAL_SECONDS);
  esp_sleep_enable_timer_wakeup(SLEEP_INTERVAL_SECONDS * uS_TO_S_FACTOR);
  esp_deep_sleep_start();
}

void loop() {
  // Never executed; deep sleep halts processor
}

