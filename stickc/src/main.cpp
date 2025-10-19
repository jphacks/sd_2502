#include <WiFi.h>
#include <HTTPClient.h>
#include <M5StickC.h>
#include <esp_wifi.h>
#include "esp_wpa2.h"
#include <ArduinoJson.h>
#include "credentials.h"  // 認証情報

const char* ssid = "eduroam";
const char* apiUrl = "https://sd-2502.vercel.app/api/message";

// 状態管理
unsigned long lastGetTime = 0;
const unsigned long getInterval = 10000;
unsigned long lastPressTime = 0;
unsigned long lastReleaseTime = 0;
bool lastButtonState = false;
int pressCount = 0;
String latestMessage = "Starting...";
bool messageUpdated = true;
bool messageIsLocal = false;  // true: 送信メッセージ, false: 受信メッセージ

// スクロール制御
int scrollX = 80;
unsigned long lastScrollTime = 0;
const int scrollSpeed = 30;

// 絵文字→文字列変換（受信時）
String interpretEmoji(String msg) {
  if (msg == "👍") return "good";
  if (msg == "❤️") return "heart";
  if (msg == "✨") return "thank you";
  return msg;
}

// スクロール表示（方向対応）
void updateScrollingMessage() {
  if (!messageUpdated && millis() - lastScrollTime < scrollSpeed) return;
  lastScrollTime = millis();

  int screenWidth = 80;
  int charWidth = 12;
  String padded = latestMessage + "     ";
  int scrollWidth = padded.length() * charWidth;

  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextSize(2);
  M5.Lcd.setTextColor(WHITE);
  M5.Lcd.setCursor(scrollX, 25);
  M5.Lcd.print(padded);

  // 方向を変える
  if (messageIsLocal) {
    scrollX += 2;
    if (scrollX > screenWidth) scrollX = -scrollWidth;
  } else {
    scrollX -= 2;
    if (scrollX < -scrollWidth) scrollX = screenWidth;
  }

  if (messageUpdated) {
    scrollX = messageIsLocal ? -scrollWidth : screenWidth;
    messageUpdated = false;
  }
}

// メッセージ送信
void sendMessage(String message) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping send.");
    return;
  }

  latestMessage = message;
  messageUpdated = true;
  messageIsLocal = true;

  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"message\":\"" + message + "\"}";
  Serial.println("Sending payload: " + payload);

  int httpCode = http.POST(payload);
  String response = http.getString();

  Serial.printf("HTTP POST code: %d\n", httpCode);
  Serial.println("Response: " + response);
  http.end();
}

// メッセージ取得
void fetchMessage() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(apiUrl);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);
    if (error) {
      Serial.print("JSON parse error: ");
      Serial.println(error.c_str());
      return;
    }

    String message = doc["message"] | "";
    message = interpretEmoji(message);

    if (message != latestMessage) {
      latestMessage = message;
      messageUpdated = true;
      messageIsLocal = false;
    }
  } else {
    Serial.printf("HTTP GET failed, code: %d\n", httpCode);
  }

  http.end();
}

// ボタン処理（1回: OK / 2回: Stay Home / 長押し: SOS）
void handleButton() {
  M5.update();
  bool currentState = M5.BtnA.isPressed();
  unsigned long currentTime = millis();

  if (currentState && !lastButtonState) {
    lastPressTime = currentTime;
  }

  if (!currentState && lastButtonState) {
    unsigned long pressDuration = currentTime - lastPressTime;

    if (pressDuration > 1000) {
      sendMessage("SOS");  // 長押し
      pressCount = 0;
    } else {
      pressCount++;
      lastReleaseTime = currentTime;
    }
  }

  if (pressCount == 1 && (currentTime - lastReleaseTime > 600)) {
    sendMessage("OK");
    pressCount = 0;
  } else if (pressCount == 2) {
    sendMessage("Stay Home");
    pressCount = 0;
  }

  lastButtonState = currentState;
}

// 初期化
void setup() {
  M5.begin();
  M5.Lcd.setRotation(3);
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextColor(WHITE);
  M5.Lcd.setTextSize(1);
  M5.Lcd.setCursor(0, 0);
  M5.Lcd.println("Starting...");

  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)EAP_IDENTITY, strlen(EAP_IDENTITY));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)EAP_USERNAME, strlen(EAP_USERNAME));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)EAP_PASSWORD, strlen(EAP_PASSWORD));
  esp_wifi_sta_wpa2_ent_enable();
  WiFi.begin(ssid);
  esp_wifi_connect();
}

// メインループ
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
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextColor(WHITE);
    M5.Lcd.println("Connecting...");
    Serial.println("WiFi connecting...");
    delay(1000);
    return;
  }

  updateScrollingMessage();
}
