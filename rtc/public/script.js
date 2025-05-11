const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const ws = new WebSocket('ws://' + window.location.host); // WebSocket URL'yi ws:// olarak düzelttik.

const peer = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Kullanıcının kameralarını ve sesini al
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
  })
  .catch(err => console.error("Kameraya erişilemedi: ", err));

peer.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

peer.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
  }
};

// WebSocket bağlantısı sağlandıktan sonra, teklif göndermek için
ws.onopen = async () => {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: 'offer', offer }));
};

// WebSocket'ten gelen mesajları dinleyelim
ws.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.type === 'offer') {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: 'answer', answer }));
  } else if (data.type === 'answer') {
    await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.type === 'candidate') {
    await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};
