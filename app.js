'use strict';

var child_process = require('child_process');

// MQTT.js
// Copyright (c) 2011 Adam Rudd.
var mqtt = require('mqtt');

// Moment.js
// Copyright (c) 2011-2015 Tim Wood, Iskren Chernev, Moment.js contributors
var moment = require('moment');

// node-console-stamp
// Copyright (c) 2013 Ståle Raknes
require('console-stamp')(console, 'yyyy/mm/dd HH:MM:ss.l');

// Load configuration
var config = require(__dirname + '/config.json');

// Set default value
var confMqttUrl = config.mqtt.url || 'mqtt://localhost:1883';
var confMqttOptions = config.mqtt.options || {};
var confDefinitions = config.definitions || [];

// Time to ignore new message after execute command (each definition)
var ignoreLimit = {};

function executeCommand(topic, message) {
  var messageStr = message.toString();

  for (var i = 0; confDefinitions.length > i; i++) {
    if (topic == confDefinitions[i].topic) {
      for(var j = 0; confDefinitions[i].commands.length > j; j++) {
        var value = confDefinitions[i].commands[j].value;

        var _valueRegexpMatch = value.match(new RegExp('^/(.*?)/([gimy]*)$'));
        if (_valueRegexpMatch) {
          var valueMatch = messageStr.match(new RegExp(_valueRegexpMatch[1], _valueRegexpMatch[2]));
        } else {
          var valueMatch = (messageStr == value);
        }

        if (valueMatch) {
          topic = topic.replace(/"/g, '\\"');
          messageStr = messageStr.replace(/"/g, '\\"');

          var cmdline = confDefinitions[i].commands[j].cmdline;
          cmdline = cmdline.replace('<topic>', topic);
          cmdline = cmdline.replace('<value>', messageStr);

          var now = moment();

          if (now.isAfter(ignoreLimit[i])) {
            // Update time
            if (confDefinitions[i].commands[j].ignoreAfterExec) {
              ignoreLimit[i] = now.add(confDefinitions[i].commands[j].ignoreAfterExec, 'seconds');
            } else {
              ignoreLimit[i] = now;
            }

            console.log('Exec: ' + cmdline);
            child_process.exec(cmdline);
          }
        }
      }
    }
  }
}

function main() {
  var mqttClient = mqtt.connect(confMqttUrl, confMqttOptions);

  mqttClient.on('connect', function() {
    console.log('Connected to ' + confMqttUrl);

    var subscribed = {};

    for (var i = 0; confDefinitions.length > i; i++) {
      // Set the current time
      if (!ignoreLimit[i]) ignoreLimit[i] = moment();

      // Subscribe to all topics in configuration
      if (!subscribed[confDefinitions[i].topic]) {
        subscribed[confDefinitions[i].topic] = true;
        mqttClient.subscribe(confDefinitions[i].topic, { qos: 2 });
        console.log('Subscribed to topic: ' + confDefinitions[i].topic);
      }
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
