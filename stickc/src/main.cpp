#include <WiFi.h>
#include <HTTPClient.h>
#include <M5StickC.h>
#include "esp_wpa2.h"
#include <ArduinoJson.h>  // JSONパース用ライブラリ

// 🔐 eduroam 認証情報を記入
#define EAP_IDENTITY "RAH06e12@tohtech.f.eduroam.jp"
#define EAP_USERNAME "RAH06e12@tohtech.f.eduroam.jp"
#define EAP_PASSWORD "5]qQmzeb]8K!"


const char* ssid = "eduroam";
const char* apiUrl = "https://sd-2502.vercel.app/api/message";

// 時間管理用
unsigned long lastGetTime = 0;
const unsigned long getInterval = 10000; // 10秒ごとにGET

// ボタン判定用
unsigned long lastPressTime = 0;
unsigned long lastReleaseTime = 0;
bool lastButtonState = false;
int pressCount = 0;

// 前回のメッセージを保存
String lastMessage = "";

void sendMessage(String message) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"message\":\"" + message + "\"}";
  int httpCode = http.POST(payload);

  Serial.printf("Sent: %s, Response: %d\n", message.c_str(), httpCode);

  // 表示
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextSize(2);
  M5.Lcd.setCursor(0, 0);
  M5.Lcd.setTextColor(WHITE);
  M5.Lcd.println("Sent:");
  M5.Lcd.println(message.substring(0, 8));  // 最大8文字
  http.end();
}

void fetchMessage() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(apiUrl);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (error) {
      Serial.println("JSON parse failed");
      return;
    }

    String message = doc["message"] | "";

    if (message != lastMessage) {
      lastMessage = message;
      Serial.println("New message: " + message);

      // 表示（横画面、大きな文字）
      M5.Lcd.fillScreen(BLACK);
      M5.Lcd.setTextSize(3);
      M5.Lcd.setTextColor(WHITE);
      M5.Lcd.setCursor(0, 0);
      M5.Lcd.println("Msg:");

      // ← ここで先頭に半角スペース１つ追加
      M5.Lcd.println(" " + message.substring(0, 24));  // 最大24文字（3行×8文字）
    }
  } else {
    Serial.printf("GET failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void handleButton() {
  M5.update();  // ボタン状態更新
  bool currentState = M5.BtnA.isPressed();
  unsigned long currentTime = millis();

  if (currentState && !lastButtonState) {
    lastPressTime = currentTime;
  }

  if (!currentState && lastButtonState) {
    unsigned long pressDuration = currentTime - lastPressTime;

    if (pressDuration > 1000) {
      // 長押し
      sendMessage("☆");
      pressCount = 0;
    } else {
      // 短押し
      pressCount++;
      lastReleaseTime = currentTime;
    }
  }

  if (pressCount == 1 && (currentTime - lastReleaseTime > 400)) {
    sendMessage("good");
    pressCount = 0;
  } else if (pressCount == 2) {
    sendMessage("bad");
    pressCount = 0;
  }

  lastButtonState = currentState;
}

void setup() {
  M5.begin();
  M5.Lcd.setRotation(3);  // 横画面
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextColor(WHITE);
  M5.Lcd.setTextSize(2);
  M5.Lcd.setCursor(0, 0);
  M5.Lcd.println("Connecting...");

  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  // WPA2 Enterprise認証
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)EAP_IDENTITY, strlen(EAP_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)EAP_USERNAME, strlen(EAP_USERNAME));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)EAP_PASSWORD, strlen(EAP_PASSWORD));
  esp_wifi_sta_wpa2_ent_enable();
  WiFi.begin(ssid);
}

void loop() {
  handleButton();

  if (WiFi.status() == WL_CONNECTED) {
    if (millis() - lastGetTime > getInterval) {
      fetchMessage();
      lastGetTime = millis();
    }
  } else {
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setCursor(0, 0);
    M5.Lcd.setTextSize(2);
    M5.Lcd.println("Connecting...");
    delay(1000);
  }
}
