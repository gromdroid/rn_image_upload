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
import Video from 'react-native-video';
import RNFetchBlob from 'rn-fetch-blob'
import ProgressBarAnimated from 'react-native-progress-bar-animated';
import { TextField } from 'react-native-material-textfield';

import {
    COLOR,
    ThemeContext,
    getTheme,
    Toolbar,
    Card,
    ActionButton,
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
            imageSourceUri: null,
            data: null,
            progress: 0,
            fileName: '',
        };
    }

    //Here we get the list with images because componentDidMount is always called before the view is rendered
    componentDidMount() {
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
                }, function() {
                    // In this block you can do something with new state.
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
    chooseImage() {
        const options = {
            height: 500,
            width: 500,
            quality: 1.0,
            storageOptions: {
                skipBackup: true
            }
        };

        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled photo picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                let source = {
                    uri: response.uri
                };

                this.setState({
                    imageSource: response.uri,
                    imageSourceUri: source,
                    data: response.data
                });
                //this.uploadPhoto();
            }
        });
    }


    //Method to upload chosen picture to WordPress hosting
    uploadPhoto() {
        var milliseconds = (new Date).getTime();
        this.setState({
            fileName: null,
            imageSource: null,
            uploading: true,
        });
        RNFetchBlob.fetch('POST', 'http://gromdroid.nl/wp/wp-json/wp/v2/media', {
                //// TODO: Real authorization instead of hardcoded base64 username:password
                'Authorization': "Basic YWRtaW46YnNsaW1faGFuemUh",
                'Content-Type': 'image/jpeg',
                'Content-Disposition': 'attachment; filename=' + this.state.fileName + '.jpg',
                // here's the body you're going to send, should be a BASE64 encoded string
                // (you can use "base64"(refer to the library 'mathiasbynens/base64') APIs to make one).
                // The data will be converted to "byte array"(say, blob) before request sent.
            }, RNFetchBlob.wrap(this.state.imageSource))
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
      let postedDate = (new Date(rawDate).getTime() / 1000) + 7200 //Add 2 hours bcuz fuck WordPress

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
      const barWidth = Dimensions.get('screen').width - 40;

      if (this.state.firstLoading) {
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
             <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
               <ActivityIndicator />
             </View>
            </ThemeContext.Provider>
          );
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
              <Image source={{uri: this.state.imageSource.toString().replace("content://com.bslim_upload.provider/external_files/", "file:///storage/emulated/0/")}} style={styles.imageViewContainer} />
              <View style={styles.textFieldTitle}>
                <TextField
                    label='File name'
                    value={fileName}
                    onChangeText={ (fileName) => this.setState({ fileName }) }
                />
              </View>
              <View style={styles.textFieldTitle}>
                <Button raised primary text="Uploaden" onPress={() => this.uploadPhoto()} />
              </View>
           </View>
          </ThemeContext.Provider>
        );
      }
      //// TODO: Better difference in date because now it has to add 2 hours manual because WordPress fucks up dates
      return (
          <ThemeContext.Provider value={getTheme(uiTheme)}>
          <Toolbar
          elevation={5}
          styles={styles.toolbar}
            leftElement="menu"
            centerElement="Upload"
            rightElement={{
              menu: {
                  icon: "more-vert",
                  labels: ["item 1", "item 2"]
              }
            }}
          />
          {this.state.uploading &&
          <View style={styles.uploadView}>
          <ProgressBarAnimated
            height={5}
            width={barWidth}
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
                    <Text style={styles.textViewTitle} >{rowData.title.rendered}</Text>
                    <Text style={styles.textViewDate} >{this.calculateDateString(rowData.date)}</Text>
                    <Image source = {{ uri: rowData.guid.rendered }} style={styles.imageViewContainer} />
                  </Card>
                </View>
              }
            />
          </View>
          <ActionButton />
          <ActionButton icon="add" onPress={() => this.chooseImage()}/>
          </ThemeContext.Provider>
      );
    }
}
const progressBarWidth = Dimensions.get('screen').width - 20;
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

    textFieldTitle: {
        margin: 10,
    }

});
