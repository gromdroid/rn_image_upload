import React, {
    Component
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    TouchableOpacity,
    NativeModules,
    Dimensions,
    Navigator,
    Platform,
    ListView,
    ActivityIndicator
} from 'react-native';

import ImagePicker from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob'
import ProgressBarAnimated from 'react-native-progress-bar-animated';
import {TextField} from 'react-native-material-textfield';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';
import * as mime from 'react-native-mime-types';
import Video from 'react-native-af-video-player'
import QRCodeScanner from 'react-native-qrcode-scanner';

import {
    COLOR,
    ThemeContext,
    getTheme,
    Toolbar,
    Card,
    Button,
} from 'react-native-material-ui';

const uiTheme = {
    palette: {
        primaryColor: COLOR.green500,
    },
    toolbar: {
        container: {
            height: 60,
        },
    },
};

class Upload extends Component {

  constructor() {
      super();
      this.state = {
          firstLoading: true,
          dataSource: null,
          imageSource: null,
          progress: 0,
          fileName: '',
          fileExtension: null,
          mimeType: null,
          filePath: null,
          qrState: false,
          pointCount: 0
      };
  };

  //Here we get the list with images because componentDidMount is always called before the view is rendered
  componentDidMount() {
      //Hide yellow warnings in the App
      console.disableYellowBox = true;
  }

  //Method to upload chosen content to WordPress hosting
  uploadContent(fileName, imageSource, mimeType, fileExtension) {
    this.setState({
      uploading: true,
    });
    RNFetchBlob.fetch('POST', 'http://gromdroid.nl/wp/wp-json/wp/v2/media', {
            //// TODO: Real authorization instead of hardcoded base64 username:password
            'Authorization': "Basic YWRtaW46YnNsaW1faGFuemUh",
            'Content-Type': + mimeType,
            'Content-Disposition': 'attachment; filename=' + fileName + '.' + fileExtension,
            // here's the body you're going to send, should be a BASE64 encoded string
            // (you can use "base64"(refer to the library 'mathiasbynens/base64') APIs to make one).
            // The data will be converted to "byte array"(say, blob) before request sent.
        }, RNFetchBlob.wrap(imageSource))
        .uploadProgress({ interval : 250 }, (written, total) => {
            console.log('uploaded', written / total);
            this.increaseProgressBar((written/total) * 100);
        })
        .then((res) => {
            this.increaseProgressBar(100);
            this.setState({
              uploading: false,
            });

            //Go back to Feed screen when done uploading
            this.props.navigation.goBack();
            //console.log(res.text())
        })
        .catch((err) => {
            // error handling ..
        })
  }

  increaseProgressBar = (value) => {
    this.setState({
      progress: value,
    });
  }

  render() {
    let fileName = this.state.fileName;
    const progressBarWidth = Dimensions.get('screen').width - 40;

    return(
      <ThemeContext.Provider value={getTheme(uiTheme)}>
         <Toolbar
           leftElement="arrow-back"
           onLeftElementPress={() => this.props.navigation.goBack()}
           centerElement="Upload"
           rightElement={{
             menu: {
                 icon: "more-vert",
                 labels: ["item 1", "item 2"]
             }
           }}
         />
        <View style={{flex: 1}}>
          {
            //Check mimeType if you need to display image or video
            this.props.navigation.getParam('mimeType') == 'image/jpeg' &&
            <Image source={{uri:  this.props.navigation.getParam('filePath')}} style={styles.imageViewContainer} />
          }
          {
            ///TODO: Videoplayer height
            this.props.navigation.getParam('mimeType') == 'video/mp4' &&
            <View style={styles.videoContainer}>
              <Video inlineOnly={true} url={this.props.navigation.getParam('filePath')} style={styles.videoPlayer} />
            </View>
          }
          <View style={styles.textFieldPadding}>
            <TextField
                label='File name'
                value={fileName}
                onChangeText={ (fileName) => this.setState({ fileName }) }
            />
          </View>
          <View style={styles.textFieldPadding}>
            <Button raised primary text="Uploaden" onPress={() => this.uploadContent(this.state.fileName, this.props.navigation.getParam('filePathRaw'), this.props.navigation.getParam('mimeType'), this.props.navigation.getParam('fileExtension'))} />
            <Button raised accent text="Cancel" onPress={() => this.props.navigation.goBack()} />
          </View>
          {
            //If there is an upload going on show progressbar
            this.state.uploading &&
            <View style={styles.progressBarView}>
              <ProgressBarAnimated
                height={5}
                width={progressBarWidth}
                maxValue={100}
                value={this.state.progress}
              />
            </View>
          }
        </View>
      </ThemeContext.Provider>
    );
  }
}

const styles = StyleSheet.create({

  imageViewContainer: {
      width: '100%',
      aspectRatio: 1
  },

  textFieldPadding: {
      margin: 10,
  },

  progressBarView: {
      margin: 20,
      marginBottom: 0,
      height: 5,
  },

});


export default Upload;
