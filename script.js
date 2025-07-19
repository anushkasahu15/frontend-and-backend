const socket = io();
let localStream;
let peerConnection;
let currentRoom = '';
let micEnabled = true;
let cameraEnabled = true;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomInput = document.getElementById('roomInput');
const roomDisplay = document.getElementById('roomDisplay');

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function getMediaAndConnect(room, isCreator) {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;

      socket.emit('join', room);
      roomDisplay.innerText = `Room: ${room}`;

      if (isCreator) {
        socket.on('user-joined', async () => {
          peerConnection = createPeerConnection(room);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('offer', { offer, room });
        });
      }

      socket.on('offer', async ({ offer }) => {
        peerConnection = createPeerConnection(room);
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer, room });
      });

      socket.on('answer', async ({ answer }) => {
        await peerConnection.setRemoteDescription(answer);
      });

      socket.on('candidate', ({ candidate }) => {
        if (candidate && peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });
    })
    .catch(err => {
      alert('Please allow camera and microphone access.');
      console.error(err);
    });
}

function createPeerConnection(room) {
  const pc = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate, room });
    }
  };

  return pc;
}

function createRoom() {
  const room = roomInput.value.trim();
  if (!room) return alert('Enter a room name');
  currentRoom = room;
  getMediaAndConnect(room, true);
}

function joinRoom() {
  const room = roomInput.value.trim();
  if (!room) return alert('Enter a room name');
  currentRoom = room;
  getMediaAndConnect(room, false);
}

function generateRoom() {
  const roomId = 'room-' + Math.random().toString(36).substring(2, 8);
  roomInput.value = roomId;
}

function copyRoom() {
  navigator.clipboard.writeText(roomInput.value)
    .then(() => alert('Room ID copied!'))
    .catch(err => console.error('Copy failed', err));
}

function toggleMic() {
  if (localStream) {
    micEnabled = !micEnabled;
    localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
  }
}

function toggleCamera() {
  if (localStream) {
    cameraEnabled = !cameraEnabled;
    localStream.getVideoTracks().forEach(track => track.enabled = cameraEnabled);
  }
}
