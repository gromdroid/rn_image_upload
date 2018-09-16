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

export default class App extends Component {


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
            filePathRaw: null,
        };
    }

    //Here we get the list with images because componentDidMount is always called before the view is rendered
    componentDidMount() {
        //Hide yellow warnings in the App
        console.disableYellowBox = true;

        return fetch('http://gromdroid.nl/wp/wp-json/wp/v2/media')
            .then((response) => response.json())
            .then((responseJson) => {
                let ds = new ListView.DataSource({
                    rowHasChanged: (r1, r2) => r1 !== r2
                });
                this.setState({
                    firstLoading: false,
                    dataSource: ds.cloneWithRows(responseJson),
                    uploading: false,
                });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    increaseProgressBar = (value) => {
      this.setState({
        progress: value,
      });
    }

    //Method for taking a picture or picking a picture from cameraroll
    ///TODO: Fix image rotation
    chooseContent(action, type) {
        const options = {
            height: 500,
            width: 500,
            quality: 1.0,
            mediaType: type,
            storageOptions: {
                skipBackup: false
            }
        };

        if(action == 'new'){
          ImagePicker.launchCamera(options, (response) => {
            this.handleChosenContent(response);
          });
        } else if(action == 'existing'){
          ImagePicker.launchImageLibrary(options, (response) => {
            this.handleChosenContent(response);
          });
        }
    }

    handleChosenContent(response){
      console.log('Response = ', response);

      if (response.didCancel) {
          console.log('User cancelled photo picker');
      } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
      } else {
          let source = {
              uri: response.uri
          };

          let filePathRaw = response.path;
          let filePath = 'file://' + response.path;
          let mimeType = mime.lookup(filePath);
          let fileExtension = mime.extension(mimeType);

          this.setState({
              fileExtension: fileExtension,
              filePath: filePath,
              filePathRaw: filePathRaw,
              mimeType: mimeType,
              imageSource: response.uri,
          });
      }

    }


    //Method to upload chosen picture to WordPress hosting
    uploadPhoto() {
        let fileName = this.state.fileName;
        let imageSource = this.state.imageSource;
        let mimeType = this.state.mimeType;
        let fileExtension = this.state.fileExtension;

        //Set all to null because after upload there is no 'main' image/video for uploading anymore
        this.setState({
            fileName: '',
            fileExtension: null,
            mimeType: null,
            imageSource: null,
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
                this.componentDidMount();
                //console.log(res.text())
            })
            .catch((err) => {
                // error handling ..
            })
    }

    calculateDateString(rawDate){
      //Time in seconds
      let currentDate = (new Date().getTime() / 1000);
      let postedDate = (new Date(rawDate).getTime() / 1000)

      let difference = Math.abs(currentDate - postedDate);

      if(difference < 3600){
        //Minute
        return 'Posted ' + Math.ceil(difference / 60) + ' minutes ago';
      } else if(difference < 86400){
        //Hours
        return 'Posted ' + Math.ceil(difference / 3600) + ' hours ago';
      } else if(difference < 604800){
        //Days
        return 'Posted ' + Math.ceil(difference / 86400) + ' days ago';
      } else {
        //Weeks
        return 'Posted ' + Math.ceil(difference / 604800) + ' weeks ago';
      }
    }

    render() {
      const progressBarWidth = Dimensions.get('screen').width - 40;

      //Show loading screen when loading images
      if (this.state.firstLoading) {
          return (
             <ThemeContext.Provider value={getTheme(uiTheme)}>
             <Toolbar
               leftElement="menu"
               centerElement="Bslim"
               rightElement={{
                 menu: {
                     icon: "more-vert",
                     labels: ["item 1", "item 2"]
                 }
               }}
             />
             <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator />
             </View>
            </ThemeContext.Provider>
          );

      //Show content upload detail screen
      } else if(this.state.imageSource != null){
        let fileName = this.state.fileName;

        return (
           <ThemeContext.Provider value={getTheme(uiTheme)}>
           <Toolbar
             leftElement="menu"
             centerElement="Upload"
             rightElement={{
               menu: {
                   icon: "more-vert",
                   labels: ["item 1", "item 2"]
               }
             }}
           />
           <View>

              {
                //Check mimeType if you need to display image or video
                this.state.mimeType== 'image/jpeg' &&
                <Image source={{uri:  this.state.filePath}} style={styles.imageViewContainer} />
              }
              {
                ///TODO: Videoplayer height
                this.state.mimeType == 'video/mp4' &&
                <Video inlineOnly={true} url={this.state.filePath} style={styles.videoPlayer} />
              }
              <View style={styles.textFieldPadding}>
                <TextField
                    label='File name'
                    value={fileName}
                    onChangeText={ (fileName) => this.setState({ fileName }) }
                />
              </View>
              <View style={styles.textFieldPadding}>
              <Button raised primary text="Uploaden" onPress={() => this.uploadPhoto()} />
              <Button raised accent text="Cancel" onPress={() => this.setState({
                  //Set everything to null again because after cancel there is no 'main' image/video
                  fileName: '',
                  fileExtension: null,
                  mimeType: null,
                  imageSource: null,
                  uploading: true,})} />
              </View>
           </View>
          </ThemeContext.Provider>
        );
      }

      //Else just render the main screen
      return (
          <ThemeContext.Provider value={getTheme(uiTheme)}>
          <Toolbar
          elevation={5}
          styles={styles.toolbar}
            leftElement="menu"
            centerElement="Bslim"
            rightElement={{
              menu: {
                  icon: "more-vert",
                  labels: ["item 1", "item 2"]
              }
            }}
          />

          {
            //If there is an upload going on show progressbar
            this.state.uploading &&
            <View style={styles.uploadView}>
            <ProgressBarAnimated
              height={5}
              width={progressBarWidth}
              maxValue={100}
              value={this.state.progress}
            />
            </View>
          }
          <View style={styles.MainContainer}>
            <ListView
             dataSource={this.state.dataSource}
             renderRow={(rowData) =>
                <View style={styles.itemView}>
                  <Card>
                    <Text style={styles.textViewTitle} >{rowData.title.rendered.replace('-', ' ')}</Text>
                    <Text style={styles.textViewDate} >{this.calculateDateString(rowData.date)}</Text>
                    {
                      //Check mimeType to display image or video
                      rowData.mime_type == 'image/jpeg' &&
                      <Image source = {{ uri: rowData.media_details.sizes.large.source_url }} style={styles.imageViewContainer} />
                    }
                    {
                      rowData.mime_type == 'video/mp4' &&
                      <Video
                          inlineOnly={true}
                          url={rowData.guid.rendered}
                      />
                    }
                  </Card>
                </View>
              }
            />
          </View>
          <ActionButton buttonColor="rgba(231,76,60,1)">
          <ActionButton.Item buttonColor='#9c27b0' title="Take picture" onPress={() => this.chooseContent('new', 'image')}>
            <Icon name="md-camera" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor='#3f51b5' title="Choose photo" onPress={() => this.chooseContent('existing', 'image')}>
            <Icon name="md-image" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor='#009688' title="Take video" onPress={() => this.chooseContent('new', 'video')}>
            <Icon name="md-videocam" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor='#00bcd4' title="Choose video" onPress={() => this.chooseContent('existing', 'video')}>
            <Icon name="md-document" style={styles.actionButtonIcon} />
          </ActionButton.Item>
        </ActionButton>
          </ThemeContext.Provider>
      );
    }
}
const styles = StyleSheet.create({

    MainContainer: {
        // Add padding at the top for iOS
        paddingTop: (Platform.OS === 'ios') ? 20 : 0,
    },

    toolbar: {
        backgroundColor: '#2E9298',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowRadius: 5,
        shadowOpacity: 1.0
    },

    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },

    videoPlayer: {
      height: '70%'
    },

    uploadView: {
        margin: 20,
        marginBottom: 0,
        height: 5,
    },

    uploadImage: {
        height: '100%',
        aspectRatio: 1
    },

    itemView: {
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
    },

    imageViewContainer: {
        width: '100%',
        aspectRatio: 1
    },

    textViewTitle: {
        margin: 10,
        marginBottom: 0,
        fontSize: 20,
        fontWeight: 'bold',
    },

    textViewDate: {
        margin: 10,
        marginTop: 0,
        fontSize: 12,
    },

    textFieldPadding: {
        margin: 10,
    }

});
