'use client'
// components/Face.tsx
import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { users } from '../user';

const Face: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userNameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      ]);
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Wait for the video to load metadata
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
      }
    };

    const recognizeFace = async () => {
      const video = videoRef.current;

      // Check if video is null before proceeding
      if (!video) {
        console.error('Video element not found.');
        return;
      }

      const canvas = faceapi.createCanvasFromMedia(video);
      if (canvasRef.current) canvasRef.current.appendChild(canvas);

      video?.addEventListener('play', async () => {
        const labeledDescriptors = await Promise.all(
          users.map(async (user) => {
            const imagePath = `/images/${user.photo}`;
            console.log('Image path:', imagePath);
            const image = await faceapi.fetchImage(imagePath);
            const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
            console.log(`Descriptor for ${user.name}:`, detections?.descriptor);

            return new faceapi.LabeledFaceDescriptors(user.name, [detections?.descriptor || new Float32Array()]);
          })
        );

        const labeledFaceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
          console.log('Detections:', detections);

          // Check if video dimensions are available
          if (video?.videoWidth > 0 && video?.videoHeight > 0) {
            const displaySize = { width: video?.videoWidth, height: video?.videoHeight };
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const results = resizedDetections.map((detection) =>
              labeledFaceMatcher.findBestMatch(detection.descriptor)
            );

            results.forEach((result, i) => {
              const box = resizedDetections[i].detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });

              // Display user name
              const userName = result.label === 'unknownPerson' ? 'Unknown Person' : result.label;

              // Draw face frame
              if (canvas?.getContext('2d')) {
                drawBox.draw(canvas);
              }

              // Update the displayed user name below the video
              if (userNameRef.current) {
                userNameRef.current.innerText = `Recognized User: ${userName}`;
              }
            });
          }
        }, 100);
      });
    };

    const setupFaceRecognition = async () => {
      await loadModels();
      await startCamera();
      await recognizeFace();
    };

    setupFaceRecognition();
  }, []);

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} autoPlay muted className="mt-4" />
      <canvas ref={canvasRef} width={640} height={480} className="mt-4 border border-gray-300"></canvas>
      <div ref={userNameRef} className="mt-4 text-xl font-bold">
        Recognized User: Unknown
      </div>
    </div>
  );
};

export default Face;



// // components/Face.js
// 'use client'
// import { useEffect, useRef } from 'react';
// import * as faceapi from 'face-api.js';
// import { users } from '../user';

// const Face = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const userNameRef = useRef(null); 
  

//   useEffect(() => {
//     const loadModels = async () => {
//       await Promise.all([
//         faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
//         faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
//         faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
//         faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
//       ]);
//     };

//     const startCamera = async () => {
//       if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//         videoRef.current.srcObject = stream;

//         // Wait for the video to load metadata
//         await new Promise((resolve) => {
//           videoRef.current.onloadedmetadata = () => {
//             resolve();
//           };
//         });
//       }
//     };

//     const recognizeFace = async () => {
//       const video = videoRef.current;
//       const canvas = faceapi.createCanvasFromMedia(video);
//       canvasRef.current.appendChild(canvas);

//       video.addEventListener('play', async () => {
//         const labeledDescriptors = await Promise.all(
//           users.map(async (user) => {
//             const imagePath = `/images/${user.photo}`;
//             console.log('Image path:', imagePath);
//             const image = await faceapi.fetchImage(imagePath);
//             const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
//             console.log(`Descriptor for ${user.name}:`, detections?.descriptor);

//             return new faceapi.LabeledFaceDescriptors(user.name, [detections?.descriptor]);
//           })
//         );

//         const labeledFaceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

//         setInterval(async () => {
//           const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
//           console.log('Detections:', detections);

//           // Check if video dimensions are available
//           if (video.videoWidth > 0 && video.videoHeight > 0) {
//             const displaySize = { width: video.videoWidth, height: video.videoHeight };
//             const resizedDetections = faceapi.resizeResults(detections, displaySize);

//             const results = resizedDetections.map((detection) =>
//               labeledFaceMatcher.findBestMatch(detection.descriptor)
//             );

//             results.forEach((result, i) => {
//               const box = resizedDetections[i].detection.box;
//               const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });

//               // Display user name
//               const userName = result.label === 'unknownPerson' ? 'Unknown Person' : result.label;
//               const x = box.x + box.width / 2;
//               const y = box.y - 10; // Adjust as needed

//               drawBox.draw(canvas);

//               // Draw user name
//               canvas.getContext('2d').fillText(userName, x, y);

//               // Update the displayed user name below the video
//               userNameRef.current.innerText = `Recognized User: ${userName}`;
//             });
//           }
//         }, 100);
//       });
//     };

//     const setupFaceRecognition = async () => {
//       await loadModels();
//       await startCamera();
//       await recognizeFace();
//     };

//     setupFaceRecognition();
//   }, []);

//   return (
//     <div>
//       <video ref={videoRef} autoPlay muted/>
//       <div ref={canvasRef}></div>
//       <div ref={userNameRef} style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
//         Recognized User: Unknown
//       </div>
//     </div>
//   );
// };

// export default Face;
// 'use client'
// // components/Face.js
// import { useEffect, useRef } from 'react';
// import * as faceapi from 'face-api.js';
// import axios from 'axios'; // Import Axios
// import { users } from '../user';

// const Face = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const userNameRef = useRef(null);

//   useEffect(() => {
//     const loadModels = async () => {
//       await Promise.all([
//         faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
//         faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
//         faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
//         faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
//       ]);
//     };

//     const startCamera = async () => {
//       if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
//         videoRef.current.srcObject = stream;

//         // Wait for the video to load metadata
//         await new Promise((resolve) => {
//           videoRef.current.onloadedmetadata = () => {
//             resolve();
//           };
//         });
//       }
//     };

//     const sendWelcomeEmail = async (email, name) => {
//       try {
//         const response = await axios.post('http://localhost:3000/api/welcome-email', {
//           email,
//           name,
//         });

//         if (response.status === 200) {
//           console.log('Welcome email sent successfully!');
//           // Store the timestamp of the last sent email in local storage
//           localStorage.setItem(`lastSentEmail_${email}`, Date.now());
//         } else {
//           console.error('Failed to send welcome email:', response.status);
//         }
//       } catch (error) {
//         console.error('Error sending welcome email:', error.message);
//       }
//     };

//     const canSendWelcomeEmail = (email) => {
//       // Get the timestamp of the last sent email from local storage
//       const lastSentEmailTimestamp = localStorage.getItem(`lastSentEmail_${email}`);
//       if (!lastSentEmailTimestamp) {
//         // If no timestamp is found, allow sending the welcome email
//         return true;
//       }

//       // Check if 24 hours have passed since the last sent email
//       const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
//       return Date.now() - parseInt(lastSentEmailTimestamp, 10) >= twentyFourHours;
//     };

//     const recognizeFace = async () => {
//       const video = videoRef.current;
//       const canvas = faceapi.createCanvasFromMedia(video);
//       canvasRef.current.appendChild(canvas);

//       video.addEventListener('play', async () => {
//         const labeledDescriptors = await Promise.all(
//           users.map(async (user) => {
//             const imagePath = `/images/${user.photo}`;
//             console.log('Image path:', imagePath);
//             const image = await faceapi.fetchImage(imagePath);
//             const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
//             console.log(`Descriptor for ${user.name}:`, detections?.descriptor);

//             return new faceapi.LabeledFaceDescriptors(user.name, [detections?.descriptor]);
//           })
//         );

//         const labeledFaceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

//         setInterval(async () => {
//           const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
//           console.log('Detections:', detections);

//           // Check if video dimensions are available
//           if (video.videoWidth > 0 && video.videoHeight > 0) {
//             const displaySize = { width: video.videoWidth, height: video.videoHeight };
//             const resizedDetections = faceapi.resizeResults(detections, displaySize);

//             const results = resizedDetections.map((detection) =>
//               labeledFaceMatcher.findBestMatch(detection.descriptor)
//             );

//             results.forEach((result, i) => {
//               const box = resizedDetections[i].detection.box;
//               const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });

//               // Display user name
//               const userName = result.label === 'unknownPerson' ? 'Unknown Person' : result.label;
//               const x = box.x + box.width / 2;
//               const y = box.y - 10; // Adjust as needed

//               drawBox.draw(canvas);

//               // Draw user name
//               canvas.getContext('2d').fillText(userName, x, y);

//               // Update the displayed user name below the video
//               userNameRef.current.innerText = `Recognized User: ${userName}`;

//               // Send welcome email for the recognized user
//               if (userName !== 'Unknown Person') {
//                 const recognizedUser = users.find((user) => user.name === userName);
//                 if (recognizedUser && canSendWelcomeEmail(recognizedUser.email)) {
//                   sendWelcomeEmail(recognizedUser.email, recognizedUser.name);
//                 }
//               }
//             });
//           }
//         }, 100);
//       });
//     };

//     const setupFaceRecognition = async () => {
//       await loadModels();
//       await startCamera();
//       await recognizeFace();
//     };

//     setupFaceRecognition();
//   }, []);

//   return (
//     <div>
//       <video ref={videoRef} autoPlay muted />
//       <div ref={canvasRef}></div>
//       <div ref={userNameRef} style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
//         Recognized User: Unknown
//       </div>
//     </div>
//   );
// };

// export default Face;

