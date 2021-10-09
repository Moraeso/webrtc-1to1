import {
  useEffect,
  useRef,
} from 'react';

let ws;
let stream;
let connection;
let offer;

const App = () => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const createConnection = () => {
    connection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
  };

  const getUserMedia = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    localVideoRef.current.srcObject = stream;
    localVideoRef.current.onloadedmetadata = () => {
      localVideoRef.current.play();
    };
    return stream;
  };

  const startWebsocket = () => {
    ws = new WebSocket('ws://local:3001');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
      }));

    };

    ws.onmessage = async (event) => {
      const res = JSON.parse(event.data);
      const type = res.type;
      const data = res.data;

      if (type === 'canOffer') {
        offer = await connection.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: true,
        });
        await connection.setLocalDescription(offer);

        ws.send(JSON.stringify({
          type: 'offer',
          data: offer,
        }));
        console.log('send offer');
      } else if (type === 'getOffer') {
        console.log('get offer');
        await connection.setRemoteDescription(data);
        const answer = await connection.createAnswer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: true,
        });
        await connection.setLocalDescription(answer);
        ws.send(JSON.stringify({
          type: 'answer',
          data: answer,
        }));
        console.log('send answer');
      } else if (type === 'getAnswer') {
        await connection.setRemoteDescription(data);
        console.log('get answer');
      } else if (type === 'getCandidate') {
        await connection.addIceCandidate(data);
        console.log('add candidate');
      }
    };
  };

  useEffect(() => {
    const start = async () => {
      createConnection();
      const stream = await getUserMedia();

      stream.getTracks().forEach((track) => {
        connection.addTrack(track, stream);
      });

      connection.addEventListener('track', (e) => {
        console.log('add remote track');
        if (remoteVideoRef.current) {
          console.log(e);
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      });

      connection.addEventListener('icecandidate', (e) => {
        try {
          if (e.candidate !== null) {
            // setLocalCandidate(e.candidate);
            ws.send(JSON.stringify({
              type: 'candidate',
              data: e.candidate,
            }));
          }
        } catch (e) {
          console.log(e);
        }
      });

      connection.addEventListener('iceconnectionstatechange', (e) => {
        console.log(connection.iceConnectionState);
      });

      connection.addEventListener('connectionstatechange', (e) => {
        console.log(connection.connectionState);
      });

      startWebsocket();
    };
    start();
  }, []);

  const onClick = async () => {
    offer = await connection.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: true,
    });
    await connection.setLocalDescription(offer);

    ws.send(JSON.stringify({
      type: 'offer',
      data: offer,
    }));
    console.log('send offer');
  }

  return (
    <div>
      <div>
        webrtc 1to1
      </div>
      {/*<button onClick={onClick}>*/}
      {/*  click*/}
      {/*</button>*/}
      <div style={{
        display: 'flex',
        marginTop: '20px',
      }}>
        <video
          ref={localVideoRef}
          controls
          autoPlay
          style={{
            width: '300px',
            height: '200px',
          }}
        />
        <video
          ref={remoteVideoRef}
          controls
          autoPlay
          style={{
            width: '300px',
            height: '200px',
            marginLeft: '20px',
          }}
        />
      </div>
    </div>
  );
};

export default App;
