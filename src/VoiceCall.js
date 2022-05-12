import React, {useCallback, useEffect, useRef, useState} from 'react';
import * as JsSIP from 'react-native-jssip';
import {Button, StyleSheet, Text, View} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import {
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';

window.RTCPeerConnection = window.RTCPeerConnection || RTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || RTCIceCandidate;
window.RTCSessionDescription =
  window.RTCSessionDescription || RTCSessionDescription;
window.MediaStream = window.MediaStream || MediaStream;
window.MediaStreamTrack = window.MediaStreamTrack || MediaStreamTrack;
window.navigator.mediaDevices = window.navigator.mediaDevices || mediaDevices;
window.navigator.getUserMedia =
  window.navigator.getUserMedia || mediaDevices.getUserMedia;

const VoiceCall = () => {
  const phoneInputRef = useRef();
  const [number, setNumber] = useState(null);
  const [numberError, setNumberError] = useState('');
  const [connection, setConnection] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [session, setSession] = useState('');
  const [callStatus, setCallStatus] = useState({
    mainStatus: null,
    subStatus: null,
  });

  const attemptConnection = () => {
    if (!connection) {
      // Create our JsSIP instance and run it:
      const uri = new JsSIP.URI('sip', 'ext20076250', 'mt1.bcall.ly', '4443');
      const socket = new JsSIP.WebSocketInterface('wss://mt1.bcall.ly:4443');

      const configuration = {
        sockets: [socket],
        uri: uri.toAor(),
        password: 'vUqms4mvAkSuj2Ak150',
        display_name: 'Doc-150',
      };

      console.log('uri.toAor()', uri.toAor());
      console.log('configuration', configuration);

      const callConnection = new JsSIP.UA(configuration);

      setConnection(callConnection);
      callConnection.start();
      JsSIP.debug.enable('JsSIP:*');
    } else {
      console.log('Already Connected');
    }
  };

  useEffect(() => {
    if (connection) {
      // WebSocket connection events
      connection.on('connected', () => {
        console.log('Connected............');
        setConnectionStatus('Connected');
      });

      connection.on('disconnected', () => {
        console.log('DisConnected............');
        setConnectionStatus('Disconnected');
      });

      // New incoming or outgoing call event
      connection.on('newRTCSession', e => {
        const newSession = e.session;

        console.log('New RTC Session created............');
        console.log('Entered in audio event listener........');

        if (newSession && newSession.connection) {
          newSession.connection.addEventListener('addstream', () => {});
        }
      });

      // SIP registration events
      connection.on('registered', () => {
        console.log('Registered............');
        setConnectionStatus('Registered');
      });

      connection.on('unregistered', () => {
        console.log('Unregistered............');
        setConnectionStatus('Unregistered');
      });

      connection.on('registrationFailed', () => {
        console.log('Registration failed............');
        setConnectionStatus('Registration Failed');
      });
    }
  });

  const makeCall = () => {
    let num = '0' + phoneInputRef.current.state.code + number;

    debugger;
    // Make a call
    if (connection && phoneInputRef.current?.isValidNumber && number !== null) {
      debugger;

      const eventHandlers = {
        progress: () => {
          console.log('call is in progress');

          setCallStatus({
            mainStatus: 'Progress',
            subStatus: null,
          });
        },
        failed: e => {
          console.log(e);
          console.log(`Call failed with cause: ${e.cause}`);

          if (e.cause === 'Unavailable') {
            setCallStatus({
              mainStatus: 'Failed',
              subStatus: 'Failed Unavailable',
            });
          } else if (e.cause === 'Canceled') {
            setCallStatus({
              mainStatus: 'Failed',
              subStatus: 'Failed Cancelled',
            });
          } else if (e.cause === 'Busy') {
            setCallStatus({
              mainStatus: 'Failed',
              subStatus: 'Failed Unavailable',
            });
          } else if (e.cause === 'User Denied Media Access') {
            setCallStatus({
              mainStatus: 'Failed',
              subStatus: 'Failed Media Access Denied',
            });
          } else {
            setCallStatus({
              mainStatus: 'Failed',
              subStatus: 'Failed for Unknown Reason',
            });
          }

          setSession(null);
        },
        ended: e => {
          // InCallManager.stop();
          console.log(e);
          console.log(`call ended with cause: ${e.cause}`);

          if (e.cause === 'Terminated') {
            setCallStatus({
              mainStatus: 'Ended',
              subStatus: 'Ended Termindated',
            });
            // setstatus("Terminated");
          } else {
            setCallStatus({
              mainStatus: 'Ended',
              subStatus: 'Ended for Unknown Reason',
            });
          }

          setSession(null);
        },
        confirmed: () => {
          console.log('call confirmed');

          setCallStatus({
            mainStatus: 'Confirmed',
            subStatus: null,
          });
        },
      };

      const options = {
        eventHandlers,
        mediaConstraints: {audio: true, video: false},
      };

      const callSession = connection.call(`sip:${num}@mt1.bcall.ly`, options);

      setSession(callSession);
    } else if (!connection) {
      setNumberError('Not Connected with the Sip Server');
    } else {
      setNumberError('Invalid Number');
    }
  };

  const endCall = () => {
    if (session) {
      session.terminate();
    }
  };

  return (
    <>
      <Text style={styles.title}>
        Please click on "CONNECT" Button to attempt connection. You'll be able
        to make call via the "CALL" Button when the connection is established.
      </Text>
      <View style={styles.containerStyle}>
        <Button
          onPress={() => {
            attemptConnection();
          }}
          title="Connect"
          color="#841584"
        />
        <Text style={styles.containerTitle}>
          Connection Status: {connectionStatus}
        </Text>
      </View>

      <View style={styles.containerStyle}>
        <PhoneInput
          ref={phoneInputRef}
          value={number}
          defaultValue={number}
          placeholder={'Phone Number'}
          defaultCode={'LY'}
          onChangeText={text => {
            setNumberError('');
            setNumber(text);
          }}
          textInputProps={'number-pad'}
          containerStyle={styles.mobileInput(numberError)}
          textContainerStyle={styles.textContainerStyle}
        />
        {numberError !== '' && <Text style={styles.error}>{numberError}</Text>}
        <Button
          onPress={() => {
            makeCall();
          }}
          title="Call"
          color="#841584"
        />
        <Text style={styles.containerTitle}>
          Call Status: {callStatus.mainStatus}
        </Text>
        {callStatus.mainStatus === 'Progress' ||
          (callStatus.mainStatus === 'Confirmed' && (
            <Button
              onPress={() => {
                endCall();
              }}
              title="End Call"
              color="#F5365C"
            />
          ))}
      </View>
    </>
  );
};
const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    marginTop: 50,
    marginBottom: 50,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
  },
  containerTitle: {
    textAlign: 'center',
    marginVertical: 8,
  },
  error: {
    marginVertical: 8,
    color: 'red',
    marginBottom: 20,
  },
  title: {
    alignItems: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  textContainerStyle: {
    backgroundColor: 'transparent',
    paddingVertical: 1,
  },
  mobileInput: errors => ({
    marginTop: 5,
    marginBottom: 10,
    borderColor: errors === '' ? '#E7EFF0' : '#F5365C',
    borderWidth: 1,
    borderRadius: 2,
    height: 50,
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 8,
  }),
});

export default VoiceCall;
