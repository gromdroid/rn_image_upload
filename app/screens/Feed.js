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
    ActivityIndicator,
} from 'react-native';

import { DrawerActions } from 'react-navigation';

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

class Feed extends Component {

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
          qrState: false,
          pointCount: 0
      };
  }

  //Here we get the list with images because componentDidMount is always called before the view is rendered
  componentDidMount() {
      //Hide yellow warnings in the App
      console.disableYellowBox = true;
      this.willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      () => {
        this.refresh();
      }
    );
      return this.refresh();
  }

  componentWillUnmount() {
    this.willFocusSubscription.remove();
  }

  refresh(){
    fetch('http://gromdroid.nl/wp/wp-json/wp/v2/media')
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

  //Method for taking a picture or picking a picture from cameraroll
  ///TODO: Fix image orientation
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

        this.props.navigation.navigate('Upload', {
          filePathRaw: filePathRaw,
          filePath: filePath,
          mimeType: mimeType,
          fileExtension: fileExtension,
          imageSource: source
        });
    }

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
    return(
      <ThemeContext.Provider value={getTheme(uiTheme)}>
         <Toolbar
           elevation={5}
           styles={styles.toolbar}
             leftElement="menu"
             onLeftElementPress={() => this.props.navigation.dispatch(DrawerActions.openDrawer())}
             centerElement={"Bslim"}
             rightElement="crop-free"
             onRightElementPress={() => this.props.navigation.navigate('ScannerQR')}
        />
       <View style={{flex: 1}}>

        {
          this.state.dataSource != null &&
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
                      <Image source = {{ uri: rowData.media_details.sizes.large.source_url }} style={styles.imageView} />
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
        }
        {
          this.state.dataSource == null &&
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
             <ActivityIndicator />
          </View>
        }
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
        </View>
      </ThemeContext.Provider>
    );
  }
}

const styles = StyleSheet.create({

    MainContainer: {
        // Add padding at the top for iOS
        paddingTop: (Platform.OS === 'ios') ? 20 : 0,
    },

    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },

    itemView: {
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
    },

    imageView: {
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

});


export default Feed;
