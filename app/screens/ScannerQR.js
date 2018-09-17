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

class ScannerQR extends Component {

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
          pointCount: 0,
          scannerReactivate: true,
      };
  };

  //Here we get the list with images because componentDidMount is always called before the view is rendered
  componentDidMount() {
      //Hide yellow warnings in the App
      console.disableYellowBox = true;
  }

  checkQR(response){
    this.setState({
      scannerReactivate: false,
    });

    if(response.data == '701F78DF4861A122BAB19BDEFCF9A02F30160067'){
      this.setState({
        pointCount: this.state.pointCount + 1,
        scannerReactivate: false,
      });
      Alert.alert(
  'Succes',
  'Point added to your account',
  [
    {text: 'OK', onPress: () => console.log('OK Pressed')},
  ],
  { cancelable: false });
    } else {
      Alert.alert(
  'Error',
  'Wrong code, try again in a few seconds',
  [
    {text: 'OK', onPress: () => console.log('OK Pressed')},
  ],
  { cancelable: false });
    }
  }

  render() {
    return(
      <ThemeContext.Provider value={getTheme(uiTheme)}>
        <Toolbar
        leftElement="arrow-back"
        onLeftElementPress={() => this.props.navigation.goBack()}
          centerElement="QR code"
          rightElement={{
            menu: {
                icon: "more-vert",
                labels: ["item 1", "item 2"]
            }
          }}
        />
        <View style={{flex: 1}}>
          <Card>
          <Text style={styles.textViewTitle} >Scan the QR code to get a point.</Text>
          <Text style={styles.textViewTitle} >You have now { this.state.pointCount } points!</Text>
          </Card>
          <QRCodeScanner
          reactivate={this.state.scannerReactivate}
          reactivateTimeout={3000}
          showMarker={true}
            onRead={(response) => this.checkQR(response)}
          />
        </View>
      </ThemeContext.Provider>
    );
  }
}

const styles = StyleSheet.create({

  textViewTitle: {
      margin: 10,
      fontSize: 20,
      fontWeight: 'bold',
  },

});

export default ScannerQR;
