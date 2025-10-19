#include <M5Unified.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "credentials.h"

const char* server_post = "https://sd-2502.vercel.app/api/message";  // Nuxt側APIに合わせて変更
const char* server_get = "https://sd-2502.vercel.app/api/message";

void sendMessage(const String& text);
void receiveMessage();

unsigned long lastGetTime = 0;
const unsigned long getInterval = 5000;

String lastReceivedMessage = "";

unsigned long lastBatteryCheckTime = 0;
const unsigned long batteryCheckInterval = 2000; // 1分ごとにチェック

void setup() {
  auto cfg = M5.config();
  cfg.internal_imu  = false;
  cfg.internal_spk  = true;
  cfg.output_power  = true;
  M5.begin(cfg);

  // speaker config
  M5.Speaker.begin();
  M5.Speaker.setVolume(50);  // 0〜255

  // display config
  M5.Display.setRotation(1);
  M5.Display.fillScreen(BLACK);
  M5.Display.setTextColor(WHITE);
  M5.Display.setTextSize(2);
  M5.Display.setCursor(10, 30);
  M5.Display.println("Connecting WiFi...");

  // wifi config
  WiFi.begin(SSID, WPA2_AUTH_PEAP, EAP_IDENTITY, EAP_USERNAME, EAP_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    M5.Display.print(".");
  }

  M5.Display.setRotation(1);
  M5.Display.fillScreen(BLACK);
  M5.Display.setCursor(10, 40);
  M5.Display.println("WiFi Connected!");
  M5.Display.setCursor(10, 90);
  M5.Display.println("A: OK");
  M5.Display.setCursor(10, 130);
  M5.Display.println("B: Stay Home");
  M5.Display.setCursor(10, 170);
  M5.Display.println("C: SOS!!");
}

void sendMessage(const String& text) {
  if (WiFi.status() != WL_CONNECTED) {
    M5.Display.setCursor(10, 180);
    M5.Display.println("WiFi lost!");
    M5.Speaker.tone(400, 200);
    return;
  }

  HTTPClient http;
  http.begin(server_post);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"message\": \"" + text + "\"}";
  int code = http.POST(json);

  M5.Display.fillRect(0, 170, 290, 25, BLACK);
  M5.Display.setCursor(10, 170);

  if (code > 0) {
    M5.Display.printf("Sent: %s (%d)", text.c_str(), code);
    M5.Speaker.tone(1000, 150); // 成功音
  } else {
    M5.Display.printf("Error (%d)", code);
    M5.Speaker.tone(300, 250); // エラー音
  }

  http.end();
}

void receiveMessage() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(server_get);
  int code = http.GET();

  if (code > 0) {
    String payload = http.getString();
    String newMessage = "";

    int start = payload.indexOf("\"message\":\"");
    if (start >= 0) {
      start += 11;
      int end = payload.indexOf("\"", start);
      newMessage = payload.substring(start, end);
    } else {
      // JSON形式でない場合はそのまま表示
      newMessage = payload;
    }

    // 新しいメッセージが最後に受信したメッセージと異なるかチェック
    if (newMessage != lastReceivedMessage) {
      // 新しいメッセージを受信した時だけ音を鳴らす
      M5.Speaker.tone(1500, 100);

      // ディスプレイを更新
      M5.Display.fillRect(0, 200, 290, 25, BLACK);
      M5.Display.setCursor(10, 200);
      M5.Display.print(newMessage);

      // 最後に受信したメッセージを更新
      lastReceivedMessage = newMessage;
    }
  }

  http.end();
}

void loop() {
  M5.update();

  if (M5.BtnA.wasPressed()) {
    M5.Speaker.tone(1200, 100);
    sendMessage("OK");
  }

  if (M5.BtnB.wasPressed()) {
    M5.Speaker.tone(800, 100);
    sendMessage("Stay Home");
  }

  if (M5.BtnC.wasPressed()) {
    M5.Speaker.tone(1000, 100);
    sendMessage("SOS!!");
  }

  unsigned long now = millis();
  if (now - lastGetTime > getInterval) {
    receiveMessage();
    lastGetTime = now;
  }

  // バッテリー残量の表示
  if (now - lastBatteryCheckTime > batteryCheckInterval) {
    int batteryLevel = M5.Power.getBatteryLevel();
    M5.Display.fillRect(0, 0, 320, 30, BLACK);
    M5.Display.setCursor(10, 10);
    M5.Display.printf("Battery: %d%%", batteryLevel);
    lastBatteryCheckTime = now;
  }

  delay(100);
}