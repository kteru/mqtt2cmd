'use strict';

// 標準モジュール
var child_process = require("child_process");

// モジュールのロード
// MQTT.js : Copyright (c) 2011 Adam Rudd.
var mqtt = require('mqtt');

// console の出力にタイムスタンプを付与
// node-console-stamp : Copyright (c) 2013 Ståle Raknes
require("console-stamp")(console, "yyyy/mm/dd HH:MM:ss.l");

// コンフィグのロードとデフォルト値セット
var config = require(__dirname + '/config.json');
var confMqttUrl = config.mqtt.url || "mqtt://localhost:1883";
var confMqttOptions = config.mqtt.options || {};
var confDefinitions = config.definitions || [];

function executeCommand(topic, message) {
  for (var i = 0; confDefinitions.length > i; i++) {
    if (topic == confDefinitions[i].topic) {
      for(var j = 0; confDefinitions[i].commands.length > j; j++) {
        if(message.toString() == confDefinitions[i].commands[j].value) {
          console.log('Exec: ' + confDefinitions[i].commands[j].cmdline);
          child_process.exec(confDefinitions[i].commands[j].cmdline);
        }
      }
    }
  }
}

function main() {
  var mqttClient = mqtt.connect(confMqttUrl, confMqttOptions);

  mqttClient.on('connect', function() {
    console.log('Connected to ' + confMqttUrl);

    for (var i = 0; confDefinitions.length > i; i++) {
      // コンフィグ中のすべての Topic を Subscribe
      mqttClient.subscribe(confDefinitions[i].topic, { qos: 2 });
      console.log('Subscribed topic: ' + confDefinitions[i].topic);
    }
  });

  mqttClient.on('close', function() {
    console.log('Disconnected from ' + confMqttUrl);
  });

  mqttClient.on('offline', function() {
    console.log('Client offline');
  });

  mqttClient.on('error', function(err) {
    console.log('Cannot connect to ' + confMqttUrl + ' : ' + err);
  });

  mqttClient.on('message', function(topic, message, packet) {
    console.log('New message: ' + topic + ' : ' +  message.toString());
    executeCommand(topic, message);
  });
}

main();
