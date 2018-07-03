import React from "react";
import {
  StyleSheet,
  SafeAreaView,
  View,
  WebView,
  TouchableHighlight,
  Image
} from "react-native";

import Tts from "react-native-tts";

import playIcon from "./assets/images/play40.png";
import pauseIcon from "./assets/images/pause56.png";

const patchPostMessageFunction = () => {
  const stripHTML = str => (str || "").replace(/<[^>]*>/g, "");

  try {
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
      const title = stripHTML(document.querySelector("header h1").innerHTML);
      const subtitle = stripHTML(document.querySelector("header p").innerHTML);
      const url = document
        .querySelector("meta[property='og:url']")
        .getAttribute("content");
      const paragraphs = Array.from(document.querySelectorAll("section p")).map(
        p => stripHTML(p.innerHTML)
      );

      const articleData = { title, subtitle, url, paragraphs };

      window.postMessage(JSON.stringify({ articleData }));
    }
  } catch (error) {
    window.postMessage(JSON.stringify({ error }));
  }
};

export default class App extends React.Component {
  render() {
    console.log(this.state);
    if (!this.patchPostMessageJsCode) {
      this.patchPostMessageJsCode =
        "(" + String(patchPostMessageFunction) + ")();";
    }
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.actionsBar}>
            <TouchableHighlight onPress={this.speak}>
              <Image source={playIcon} />
            </TouchableHighlight>
            )
          </View>
          <WebView
            injectedJavaScript={this.patchPostMessageJsCode}
            source={{ uri: "https:/www.haaretz.co.il/" }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              left: 0,
              bottom: 0
            }}
            onMessage={this.onMessage}
          />
        </View>
      </SafeAreaView>
    );
  }

  state = { url: null, title: null, subtitle: null, paragraphs: null };

  onMessage = event => {
    try {
      const parsedData = JSON.parse(event.nativeEvent.data);

      if (
        parsedData.articleData &&
        this.state.url !== parsedData.articleData.url
      ) {
        this.setState(parsedData.articleData);
      }

      if (parsedData.error) {
        console.log("ERROR", parsedData.error);
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  speak = () => {
    Tts.getInitStatus().then(() => {
      const voiceParams = {
        iosVoiceId: "com.apple.ttsbundle.Carmit-compact"
      };

      Tts.speak(this.state.title, voiceParams);
      Tts.speak(this.state.subtitle, voiceParams);

      console.log(this.state.paragraphs);

      this.state.paragraphs.forEach(paragraph =>
        Tts.speak(paragraph, voiceParams)
      );

      // Tts.voices().then(voices => console.log(voices));
    });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative"
  },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  actionsBar: {
    justifyContent: "center"
  }
});
