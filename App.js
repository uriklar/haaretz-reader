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

//pic.twitter.com\/[a-zA-z]+

const patchPostMessageFunction = () => {
  const stripHTML = str =>
    (str || "").replace(/<[^>]*>/g, "").replace(/nbsp;/g, " ");
  const stripImages = str =>
    (str || "").replace(/pic.twitter.com\/[a-zA-z]+/g, "");
  const stripSpecialChars = str =>
    (str || "").replace(/\(|\)|&|"|'|nbsp;/g, "");

  const strip = str => stripSpecialChars(stripImages(stripHTML(str)));

  const flatMap = (arr, lambda) => {
    return Array.prototype.concat.apply([], arr.map(lambda));
  };

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
      const title = strip(document.querySelector("header h1").innerHTML);
      const subtitle = strip(document.querySelector("header p").innerHTML);
      const url = document
        .querySelector("meta[property='og:url']")
        .getAttribute("content");
      const sentances = flatMap(
        Array.from(document.querySelectorAll("section p")),
        p => strip(p.innerHTML).split(".")
      );

      const articleData = { title, subtitle, url, sentances };

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
            {this.state.voice &&
              !this.state.speaking && (
                <TouchableHighlight onPress={() => this.setSpeaking(true)}>
                  <Image source={playIcon} />
                </TouchableHighlight>
              )}
            )
            {this.state.voice &&
              this.state.speaking && (
                <TouchableHighlight onPress={() => this.setSpeaking(false)}>
                  <Image source={pauseIcon} />
                </TouchableHighlight>
              )}
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

  state = {
    url: null,
    title: null,
    subtitle: null,
    sentances: null,
    voices: [],
    currentSentance: 0,
    speaking: false
  };

  componentDidMount() {
    Tts.getInitStatus().then(() => {
      Tts.voices().then(voices => {
        const hebrewVoices = voices.filter(v => v.language === "he-IL");

        this.setState({ voice: hebrewVoices[0] });
      });
    });

    Tts.addEventListener("tts-finish", () => {
      console.log("finished sentance");
      this.setState({ currentSentance: this.state.currentSentance + 1 });
    });
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.speaking && !prevState.speaking) {
      return this.speak();
    }

    console.log(
      "did update",
      prevState.currentSentance,
      this.state.currentSentance
    );

    if (
      prevState.currentSentance < this.state.currentSentance &&
      this.state.speaking
    ) {
      return this.speak();
    }
  }

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
        //console.log("ERROR", parsedData.error);
      }
    } catch (e) {
      //  console.log("error", e);
    }
  };

  setSpeaking = speaking => {
    this.setState({ speaking });
  };

  speak = () => {
    const voiceParams = {
      iosVoiceId: this.state.voice.id
    };

    console.log("in speak with", this.state.currentSentance);

    Tts.speak(this.state.sentances[this.state.currentSentance], voiceParams);
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
