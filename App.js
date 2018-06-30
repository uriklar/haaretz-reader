import React from "react";
import { StyleSheet, Text, View, WebView } from "react-native";

import Tts from "react-native-tts";

const patchPostMessageFunction = function() {
  var originalPostMessage = window.postMessage;

  var patchedPostMessage = function(message, targetOrigin, transfer) {
    originalPostMessage(message, targetOrigin, transfer);
  };

  patchedPostMessage.toString = function() {
    return String(Object.hasOwnProperty).replace(
      "hasOwnProperty",
      "postMessage"
    );
  };

  window.postMessage = patchedPostMessage;

  if (!window.isHomePage) {
    const title = document.querySelector("header h1").innerHTML;
    const subtitle = document.querySelector("header p").innerHTML;
    const url = document
      .querySelector("meta[property='og:url']")
      .getAttribute("content");

    const articleData = { title, subtitle, url };

    window.postMessage(JSON.stringify({ articleData }));
  }

  //window.postMessage(document.querySelector("header h1").innerHTML);
};

export default class App extends React.Component {
  render() {
    console.log(this.state);
    if (!this.patchPostMessageJsCode) {
      this.patchPostMessageJsCode =
        "(" + String(patchPostMessageFunction) + ")();";
    }
    return (
      <View style={styles.container}>
        <WebView
          injectedJavaScript={this.patchPostMessageJsCode}
          source={{ uri: "https:/www.haaretz.co.il/" }}
          style={{ position: "absolute", top: 0, right: 0, left: 0, bottom: 0 }}
          onMessage={this.onMessage}
        />
      </View>
    );
  }

  state = { url: null, title: null, subtitle: null };

  onMessage = event => {
    try {
      const parsedData = JSON.parse(event.nativeEvent.data);

      if (
        parsedData.articleData &&
        this.state.url !== parsedData.articleData.url
      ) {
        this.setState(parsedData.articleData);
        //this.speak(parsedData.articleData);
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  speak = data => {
    Tts.getInitStatus().then(() => {
      Tts.speak(data.title + " " + data.subtitle, {
        iosVoiceId: "com.apple.ttsbundle.Carmit-compact"
      });

      // Tts.voices().then(voices => console.log(voices));
    });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative"
  }
});
