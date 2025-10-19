#include <M5Core2.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "credentials.h"  // 認証情報を外部から読み込む

const char* server = "https://sd-2502.vercel.app/api/message";  // Nuxt側API

void sendMessage(const String& text);

void setup() {
  M5.begin(true, true, true, true);
  M5.Lcd.setRotation(1);
  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setTextColor(WHITE);
  M5.Lcd.setTextSize(2);

  M5.Lcd.setCursor(10, 30);
  M5.Lcd.println("Connecting WiFi...");

  WiFi.begin(SSID, WPA2_AUTH_PEAP, EAP_IDENTITY, EAP_USERNAME, EAP_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    M5.Lcd.print(".");
  }

  M5.Lcd.fillScreen(BLACK);
  M5.Lcd.setCursor(10, 40);
  M5.Lcd.println("WiFi Connected!");
  M5.Lcd.setCursor(10, 90);
  M5.Lcd.println("A: OK");
  M5.Lcd.setCursor(10, 130);
  M5.Lcd.println("B: NG");
}

void sendMessage(const String& text) {
  if (WiFi.status() != WL_CONNECTED) {
    M5.Lcd.setCursor(10, 180);
    M5.Lcd.println("WiFi lost!");
    return;
  }

  HTTPClient http;
  http.begin(server);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"message\": \"" + text + "\"}";
  int code = http.POST(json);

  M5.Lcd.fillRect(0, 200, 320, 20, BLACK);
  M5.Lcd.setCursor(10, 200);

  if (code > 0) {
    M5.Lcd.printf("Sent: %s (%d)", text.c_str(), code);
  } else {
    M5.Lcd.printf("Error (%d)", code);
  }

  http.end();
}

void loop() {
  M5.update();

  if (M5.BtnA.wasPressed()) {
    sendMessage("OK");
  }

  if (M5.BtnB.wasPressed()) {
    sendMessage("NG");
  }

  delay(100);
}
