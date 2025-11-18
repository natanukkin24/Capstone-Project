import React, { useEffect, useRef, useState, useCallback } from 'react';
import websocketService from '../../services/websocket';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/PhaserGame.css';

const Game = () => {
  const canvasRef = useRef(null);
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [gameReady, setGameReady] = useState(false);
  const [players, setPlayers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef(null);
  const playersRef = useRef([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [questionFeedback, setQuestionFeedback] = useState(null);
  const questionLockRef = useRef(false);
  const audioCtxRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const musicGainRef = useRef(null);
  const musicOscillatorsRef = useRef([]);
  const musicPatternIntervalRef = useRef(null);
  const musicStepRef = useRef(0);

  const initAudioContext = useCallback(() => {
    if (audioUnlockedRef.current) return;
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    audioUnlockedRef.current = true;
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    if (musicPatternIntervalRef.current) {
      clearInterval(musicPatternIntervalRef.current);
      musicPatternIntervalRef.current = null;
    }
    musicOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (err) {
        // ignore
      }
    });
    musicOscillatorsRef.current = [];
    if (musicGainRef.current) {
      try {
        musicGainRef.current.disconnect();
      } catch (err) {
        // ignore
      }
      musicGainRef.current = null;
    }
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (!audioUnlockedRef.current || !audioCtxRef.current) return;
    if (musicOscillatorsRef.current.length > 0) return;
    const ctx = audioCtxRef.current;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.connect(ctx.destination);
    musicGainRef.current = gain;

    const createOsc = (type) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.connect(gain);
      osc.start();
      return osc;
    };

    const bassOsc = createOsc('sine');
    const harmonyOsc = createOsc('triangle');
    musicOscillatorsRef.current = [bassOsc, harmonyOsc];

    const chords = [
      { bass: 196, harmony: 294 },
      { bass: 220, harmony: 330 },
      { bass: 247, harmony: 370 },
      { bass: 233, harmony: 349 }
    ];

    const applyChord = () => {
      const chord = chords[musicStepRef.current % chords.length];
      const now = ctx.currentTime;
      bassOsc.frequency.exponentialRampToValueAtTime(chord.bass, now + 0.25);
      harmonyOsc.frequency.exponentialRampToValueAtTime(chord.harmony, now + 0.25);
    };

    applyChord();
    musicPatternIntervalRef.current = setInterval(() => {
      musicStepRef.current = (musicStepRef.current + 1) % chords.length;
      applyChord();
    }, 5000);
  }, []);

  const playSound = useCallback((type) => {
    if (!audioUnlockedRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    let frequency = 440;
    let duration = 0.2;
    let waveform = 'triangle';
    let volume = 0.25;

    switch (type) {
      case 'question':
        frequency = 620;
        duration = 0.25;
        waveform = 'sine';
        volume = 0.3;
        break;
      case 'correct':
        frequency = 740;
        duration = 0.35;
        waveform = 'square';
        volume = 0.35;
        break;
      case 'incorrect':
        frequency = 260;
        duration = 0.4;
        waveform = 'sawtooth';
        volume = 0.3;
        break;
      case 'interact':
        frequency = 500;
        duration = 0.2;
        waveform = 'triangle';
        volume = 0.28;
        break;
      default:
        break;
    }

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, []);
  const openQuestionModal = useCallback((question) => {
    if (!question) return;
    questionLockRef.current = true;
    setActiveQuestion(question);
    setSelectedAnswer('');
    setQuestionFeedback(null);
    playSound('question');
  }, [playSound]);

  const closeQuestionModal = () => {
    questionLockRef.current = false;
    setActiveQuestion(null);
    setSelectedAnswer('');
    setQuestionFeedback(null);
  };

  const handleSubmitAnswer = () => {
    if (!activeQuestion || questionFeedback) return;
    let answerValue = selectedAnswer;

    if (activeQuestion.questionType === 'fill_in_the_blank') {
      answerValue = (selectedAnswer || '').trim();
    }

    if (!answerValue) {
      return;
    }

    const normalizedAnswer = (answerValue || '').trim().toLowerCase();
    const normalizedCorrect = (activeQuestion.correctAnswer || '').trim().toLowerCase();
    const isCorrect = normalizedAnswer === normalizedCorrect;

    setQuestionFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');

    websocketService.sendAnswer({
      quizId,
      questionId: activeQuestion._id || activeQuestion.id || activeQuestion.questionText,
      answer: answerValue,
      isCorrect
    });
  };

  const renderQuestionControls = () => {
    if (!activeQuestion) return null;

    if (activeQuestion.questionType === 'multiple_choice') {
      const options = (activeQuestion.options || []).filter(opt => opt && opt.trim() !== '');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 14px)', marginTop: 'clamp(10px, 2vw, 16px)' }}>
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={`${option}-${index}`}
                type="button"
                onClick={() => setSelectedAnswer(option)}
                disabled={!!questionFeedback}
                style={{
                  padding: 'clamp(10px, 2.2vw, 14px)',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #4CAF50' : '1px solid #ccc',
                  backgroundColor: isSelected ? '#e8f5e9' : '#fff',
                  textAlign: 'left',
                  cursor: questionFeedback ? 'not-allowed' : 'pointer',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: 'clamp(14px, 3.5vw, 18px)'
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    if (activeQuestion.questionType === 'true_false') {
      const options = ['True', 'False'];
      return (
        <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 16px)', marginTop: 'clamp(10px, 2vw, 16px)', flexWrap: 'wrap' }}>
          {options.map(option => {
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedAnswer(option)}
                disabled={!!questionFeedback}
                style={{
                  flex: '1 1 45%',
                  minWidth: '130px',
                  padding: 'clamp(10px, 2.5vw, 16px)',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #4CAF50' : '1px solid #ccc',
                  backgroundColor: isSelected ? '#e8f5e9' : '#fff',
                  cursor: questionFeedback ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: 'clamp(14px, 4vw, 18px)'
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    // fill_in_the_blank or default
    return (
      <input
        type="text"
        value={selectedAnswer}
        disabled={!!questionFeedback}
        onChange={(e) => setSelectedAnswer(e.target.value)}
        placeholder="Type your answer"
        style={{
          width: '100%',
          padding: 'clamp(10px, 2.5vw, 16px)',
          borderRadius: '8px',
          border: '1px solid #ccc',
          marginTop: 'clamp(10px, 2vw, 16px)',
          fontSize: 'clamp(14px, 4vw, 18px)'
        }}
      />
    );
  };
  const DIRECTION_OFFSETS = {
    right: 0,   // FIRST 6 frames
    up: 6,
    left: 12,   // THIRD 6 frames
    down: 18,
  };

  // Check if user is teacher (spectator) or student (player)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTeacher = user.role === 'teacher';
  const isStudent = user.role === 'student';

  // Fetch quiz data to get map and other details
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isTeacher = user.role === 'teacher';

        // Fetch quiz data based on user role
        let response;
        if (isTeacher) {
          response = await axios.get(
            `http://localhost:5000/api/quiz/${quizId}/lobby-details`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          response = await axios.get(
            `http://localhost:5000/api/quiz/${quizId}/lobby`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        if (response.data && response.data.quiz) {
          setQuizData(response.data.quiz);
          
          // Store players with their names from the API response
          if (response.data.players && Array.isArray(response.data.players)) {
            setPlayers(response.data.players);
            playersRef.current = response.data.players;
          }
          
          // Set timer based on difficulty
          const difficulty = response.data.quiz.difficulty || 'easy';
          let minutes = 45; // default easy
          if (difficulty === 'medium') {
            minutes = 30;
          } else if (difficulty === 'hard') {
            minutes = 15;
          }
          setTimeRemaining(minutes * 60); // Convert to seconds
        } else {
          console.error('Quiz data not found in response:', response.data);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        // Set a default map if fetch fails
        setQuizData({ map: 'house' });
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuizData();
    }
  }, [quizId, navigate]);

  useEffect(() => {
    // Don't initialize game until quiz data is loaded
    if (loading || !canvasRef.current) {
      return;
    }

    // Initialize WebSocket connection
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to play');
      navigate('/');
      return;
    }

    websocketService.connect(token, quizId);

    // Set up WebSocket event listeners
    websocketService.on('player-joined', (data) => {
      console.log('Player joined:', data);
      setPlayers(prev => {
        const updated = [...prev, data];
        playersRef.current = updated;
        return updated;
      });
    });

    websocketService.on('player-left', (data) => {
      console.log('Player left:', data);
      setPlayers(prev => {
        const updated = prev.filter(p => p.userId !== data.userId);
        playersRef.current = updated;
        return updated;
      });
      // Remove player from game state
      if (gameStateRef.current && data.userId) {
        delete gameStateRef.current.otherPlayers[data.userId];
      }
    });

    websocketService.on('player-moved', (data) => {
      console.log('Player moved - Full data:', {
        userId: data.userId,
        position: data.position,
        direction: data.direction,
        facingDirection: data.facingDirection,
        currentFrame: data.currentFrame
      });
      // Update other players' positions in the game
      if (gameStateRef.current) {
        gameStateRef.current.updatePlayerPosition({
          userId: data.userId,
          position: data.position,
          direction: data.direction,
          facingDirection: data.facingDirection,
          currentFrame: data.currentFrame
        });
      }
    });

    // Listen for initial player positions when they join
    websocketService.on('player-joined-lobby', (data) => {
      console.log('Player joined lobby:', data);
      // Store player name if available
      if (data.player && gameStateRef.current) {
        const userId = data.player.id || data.player._id;
        if (userId && gameStateRef.current.otherPlayers[userId]) {
          gameStateRef.current.otherPlayers[userId].firstname = data.player.firstname;
          gameStateRef.current.otherPlayers[userId].lastname = data.player.lastname;
          gameStateRef.current.otherPlayers[userId].username = data.player.username;
        }
      }
      if (gameStateRef.current && data.position) {
        gameStateRef.current.updatePlayerPosition({
          userId: data.userId || data.id || (data.player && (data.player.id || data.player._id)),
          position: data.position
        });
      }
    });

    websocketService.on('answer-submitted', (data) => {
      console.log('Answer submitted:', data);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = user.id;
      
      if (data.isCorrect && data.userId === currentUserId) {
        setScore(prev => prev + 10);
      }
    });

    // Listen for game pause/resume events
    websocketService.on('game-state-updated', (data) => {
      if (data.gameState && data.gameState.status === 'paused') {
        setIsPaused(true);
      } else if (data.gameState && data.gameState.status === 'resumed') {
        setIsPaused(false);
      }
    });

    // Game state
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas to fullscreen
    const updateCanvasSize = () => {
    const dpr = window.devicePixelRatio || 1;

    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;

    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    // Draw using CSS pixel units for consistency
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Game state object
    const gameState = {
      mapCanvas: null,
      mapCtx: null,
      dpr: window.devicePixelRatio || 1,
      targetFPS: 60,
      frameDuration: 1000 / 60,
      accumulator: 0,

      map: null,
      mapImage: null,
      mapScale: 1,
      player: {
        x: 400,
        y: 300,
        width: 32,
        height: 32,
        speed: 200,
        velocityX: 0,
        velocityY: 0,
        sprite: null,
        currentFrame: 0,
        animationFrame: 0,
        direction: 'idle',
        facingDirection: 'down' // 'up', 'down', 'left', 'right'
      },
      interactables: [],
      nextQuestionIndex: 0,
      otherPlayers: {},
      keys: {},
      lastTime: 0,
      lastPositionUpdate: 0,
      camera: { 
        x: 0, 
        y: 0,
        targetX: 0,
        targetY: 0,
        velocityX: 0, // Camera velocity for smooth movement
        velocityY: 0,
        smoothing: 0.1 // Exponential smoothing factor (lower = smoother)
      },
      
      // Update player position from WebSocket
      updatePlayerPosition: function(data) {
        const { userId, position, direction, facingDirection, currentFrame } = data;
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = userData.id;
        const currentUserRole = userData.role;
        
        // For teachers, show all students. For students, skip themselves.
        if (currentUserRole === 'student' && userId === currentUserId) {
          return; // Skip current player (only for students)
        }
        
        // Update or create player position
        if (!this.otherPlayers[userId]) {
          // Try to find player name from players ref (improved ID matching)
          const playerData = playersRef.current.find(p => {
            const pId = String(p.id || p._id || '');
            const otherId = String(userId || '');
            return pId === otherId && pId !== '';
          });
          this.otherPlayers[userId] = {
            x: position.x,
            y: position.y,
            width: 32,
            height: 32,
            userId: userId,
            facingDirection: facingDirection || 'down',
            direction: direction || 'idle',
            currentFrame: currentFrame || 0,
            lastUpdateTime: performance.now(),
            firstname: playerData?.firstname,
            lastname: playerData?.lastname,
            username: playerData?.username
          };
        } else {
          this.otherPlayers[userId].x = position.x;
          this.otherPlayers[userId].y = position.y;
          // Always update direction, facingDirection, and currentFrame if provided
          // Use explicit checks to ensure we update even if value is 0 or empty string
          if (facingDirection !== undefined && facingDirection !== null) {
            this.otherPlayers[userId].facingDirection = facingDirection;
          }
          if (direction !== undefined && direction !== null && direction !== '') {
            this.otherPlayers[userId].direction = direction;
          }
          if (currentFrame !== undefined && currentFrame !== null) {
            this.otherPlayers[userId].currentFrame = currentFrame;
          }
          this.otherPlayers[userId].lastUpdateTime = performance.now();
          
          // Debug logging for teachers
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData.role === 'teacher') {
            console.log(`Updated player ${userId}:`, {
              direction: this.otherPlayers[userId].direction,
              facingDirection: this.otherPlayers[userId].facingDirection,
              currentFrame: this.otherPlayers[userId].currentFrame
            });
          }
        }
      }
    };

    const gameStateRef = { current: gameState };

    // Load map
    const loadMap = async () => {
      try {
        // Load map JSON
        const mapResponse = await fetch('/Map/city_unfinished.json');
        const mapData = await mapResponse.json();
        gameState.map = mapData;

        // Load tileset JSON if tileset has external source
        if (mapData.tilesets && mapData.tilesets[0] && mapData.tilesets[0].source) {
          const tilesetSource = mapData.tilesets[0].source.replace('.tsx', '.json');
          const tilesetResponse = await fetch(`/Map/${tilesetSource}`);
          const tilesetData = await tilesetResponse.json();
          // Merge tileset data into the tileset object
          Object.assign(mapData.tilesets[0], tilesetData);
        }

        // Load tileset image
        const tilesetImage = new Image();
        tilesetImage.src = '/Map/tilemap.png';
        await new Promise((resolve, reject) => {
          tilesetImage.onload = resolve;
          tilesetImage.onerror = reject;
        });
        gameState.mapImage = tilesetImage;

        // Calculate scale - same dimension for both players and spectators
        const mapWidth = mapData.width * mapData.tilewidth;
        const mapHeight = mapData.height * mapData.tileheight;
        const scaleX = canvas.width / mapWidth;
        const scaleY = canvas.height / mapHeight;
        const baseScale = Math.max(scaleX, scaleY);
        
        // Use same scale for both teachers and students
        gameState.mapScale = baseScale;

        const getObjectProperty = (object, propName) => {
          if (!object?.properties) return undefined;
          const prop = object.properties.find((property) => property.name === propName);
          return prop ? prop.value : undefined;
        };

        const interactableLayer = mapData.layers?.find(
          (layer) => layer.name === 'interactables' && layer.type === 'objectgroup'
        );

        if (interactableLayer && Array.isArray(interactableLayer.objects)) {
          gameState.interactables = interactableLayer.objects.map((obj) => ({
            id: obj.id,
            x: obj.x * gameState.mapScale,
            y: obj.y * gameState.mapScale,
            width: (obj.width || 0) * gameState.mapScale,
            height: (obj.height || 0) * gameState.mapScale,
            name: obj.name || getObjectProperty(obj, 'name') || 'Interactable',
            type: getObjectProperty(obj, 'type') || obj.type || 'generic',
            triggered: false
          }));
        } else {
          gameState.interactables = [];
        }

        console.log('Map loaded successfully', { mapWidth, mapHeight, scale: gameState.mapScale, isTeacher });
        renderMapToCanvas(gameState);
        
        // Initialize camera position
        const mapPixelWidth = mapWidth * gameState.mapScale;
        const mapPixelHeight = mapHeight * gameState.mapScale;
        const canvasWidth = canvas.width / gameState.dpr;
        const canvasHeight = canvas.height / gameState.dpr;
        
        if (isTeacher) {
          // Teachers: camera at 0,0 to show full map
          gameState.camera.x = 0;
          gameState.camera.y = 0;
          gameState.camera.targetX = 0;
          gameState.camera.targetY = 0;
        } else {
          // Students: center camera on map
          gameState.camera.x = Math.max(0, (mapPixelWidth - canvasWidth) / 2);
          gameState.camera.y = Math.max(0, (mapPixelHeight - canvasHeight) / 2);
          gameState.camera.targetX = gameState.camera.x;
          gameState.camera.targetY = gameState.camera.y;
        }
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    function renderMapToCanvas(state) {
    const map = state.map;
    const tilesetImg = state.mapImage;
    if (!map || !tilesetImg) {
      console.error('Cannot render map: missing map or tileset image', { hasMap: !!map, hasTileset: !!tilesetImg });
      return;
    }

    const mapPixelWidth = map.width * map.tilewidth * state.mapScale;
    const mapPixelHeight = map.height * map.tileheight * state.mapScale;

    const dpr = state.dpr;

    const off = document.createElement('canvas');
    off.width = Math.ceil(mapPixelWidth * dpr);
    off.height = Math.ceil(mapPixelHeight * dpr);
    off.style.width = mapPixelWidth + 'px';
    off.style.height = mapPixelHeight + 'px';

    const offCtx = off.getContext('2d');
    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offCtx.imageSmoothingEnabled = false;

    // Fill background first to verify canvas is working
    offCtx.fillStyle = '#87CEEB'; // Sky blue background
    offCtx.fillRect(0, 0, mapPixelWidth, mapPixelHeight);

    const tileset = map.tilesets[0];
    if (!tileset) {
      console.error('No tileset found in map');
      return;
    }
    
    // Use map tilewidth/tileheight if tileset doesn't have them
    const tw = tileset.tilewidth || map.tilewidth;
    const th = tileset.tileheight || map.tileheight;
    const tilesPerRow = tileset.columns || Math.floor((tileset.imagewidth || tilesetImg.width) / (tw + (tileset.spacing || 0)));
    const spacing = tileset.spacing || 0;
    const margin = tileset.margin || 0;
    
    console.log('Tileset info:', { 
      columns: tilesPerRow, 
      tilewidth: tw, 
      tileheight: th, 
      spacing, 
      margin,
      imagewidth: tileset.imagewidth || tilesetImg.width,
      imageheight: tileset.imageheight || tilesetImg.height
    });

    let tilesDrawn = 0;
    if (!map.layers || map.layers.length === 0) {
      console.warn('Map has no layers');
    } else {
      map.layers.forEach(layer => {
        if (layer.type !== "tilelayer") return;
        if (!layer.data || !Array.isArray(layer.data)) {
          console.warn('Layer has no data array:', layer.name);
          return;
        }

        for (let y = 0; y < layer.height; y++) {
          for (let x = 0; x < layer.width; x++) {
            const idx = y * layer.width + x;
            const gid = layer.data[idx];
            if (!gid || gid === 0) continue;

            const localId = gid - tileset.firstgid;
            if (localId < 0) continue; // Skip invalid tile IDs
            
            const sx = (localId % tilesPerRow) * (tw + spacing) + margin;
            const sy = Math.floor(localId / tilesPerRow) * (th + spacing) + margin;

            offCtx.drawImage(
              tilesetImg,
              sx, sy, tw, th,
              x * tw * state.mapScale,
              y * th * state.mapScale,
              tw * state.mapScale,
              th * state.mapScale
            );
            tilesDrawn++;
          }
        }
      });
    }

    console.log(`Rendered ${tilesDrawn} tiles to map canvas`, {
      mapCanvasSize: { width: off.width, height: off.height },
      mapPixelSize: { width: mapPixelWidth, height: mapPixelHeight },
      dpr: dpr
    });

    state.mapCanvas = off;
    state.mapCtx = offCtx;
  }


    // Load character sprites
    const loadCharacterSprites = async () => {
      try {
        const idleImage = new Image();
        idleImage.src = '/Character/Adam_idle_anim_16x16.png';
        await new Promise((resolve, reject) => {
          idleImage.onload = () => {
            console.log('Idle sprite loaded:', {
              width: idleImage.width,
              height: idleImage.height,
              naturalWidth: idleImage.naturalWidth,
              naturalHeight: idleImage.naturalHeight
            });
            resolve();
          };
          idleImage.onerror = (err) => {
            console.error('Failed to load idle sprite:', err);
            reject(err);
          };
        });
        gameState.player.idleSprite = idleImage;

        const runImage = new Image();
        runImage.src = '/Character/Adam_run_16x16.png';
        await new Promise((resolve, reject) => {
          runImage.onload = () => {
            console.log('Run sprite loaded:', {
              width: runImage.width,
              height: runImage.height,
              naturalWidth: runImage.naturalWidth,
              naturalHeight: runImage.naturalHeight
            });
            resolve();
          };
          runImage.onerror = (err) => {
            console.error('Failed to load run sprite:', err);
            reject(err);
          };
        });
        gameState.player.runSprite = runImage;
        gameState.player.sprite = idleImage;
        
        // Store sprites in gameState for use by other players (for teachers to see students)
        gameState.idleSprite = idleImage;
        gameState.runSprite = runImage;

        console.log('Character sprites loaded successfully');
      } catch (error) {
        console.error('Error loading character sprites:', error);
      }
    };

    // Initialize game
    const initGame = async () => {
      await loadMap();
      // Load character sprites for both teachers and students (teachers need them to see students)
      await loadCharacterSprites();
      setGameReady(true);
    };

    initGame();

    // Keyboard input
    const handleKeyDown = (e) => {
      initAudioContext();
      startBackgroundMusic();
      if (isTeacher) return; // Teachers can't control
      if (isPaused) return; // Don't allow movement when paused
      gameState.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      if (isTeacher) return;
      if (isPaused) return; // Don't allow movement when paused
      gameState.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Update camera to follow player (optimized for 60fps)
    const updateCamera = (state, deltaTime) => {
      const camera = state.camera;
      const dpr = state.dpr || 1;
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;
      
      if (isTeacher) {
        // For teachers: disable camera movement, show entire map (same as students now)
        camera.x = 0;
        camera.y = 0;
        camera.targetX = 0;
        camera.targetY = 0;
        camera.velocityX = 0;
        camera.velocityY = 0;
        return; // Skip camera smoothing for teachers
      } else {
        // For students: follow their own player with a deadzone (same map scale as teachers)
        // This prevents the camera from constantly adjusting for tiny movements
        const player = state.player;
        const deadzoneWidth = canvasWidth * 0.25; // 25% of screen width
        const deadzoneHeight = canvasHeight * 0.25; // 25% of screen height
        
        // Calculate ideal camera position (player centered)
        const idealCameraX = player.x - canvasWidth / 2;
        const idealCameraY = player.y - canvasHeight / 2;
        
        // Calculate player position relative to current camera center
        const playerOffsetX = player.x - (camera.x + canvasWidth / 2);
        const playerOffsetY = player.y - (camera.y + canvasHeight / 2);
        
        // Only update target if player is outside deadzone
        // This creates a "soft" deadzone where small movements don't trigger camera movement
        if (Math.abs(playerOffsetX) > deadzoneWidth / 2) {
          camera.targetX = idealCameraX;
        } else {
          // Player is in deadzone - keep camera target stable to prevent jitter
          // But allow slight movement if player is moving towards edge
          camera.targetX = camera.x + (idealCameraX - camera.x) * 0.1; // Very slow drift
        }
        
        if (Math.abs(playerOffsetY) > deadzoneHeight / 2) {
          camera.targetY = idealCameraY;
        } else {
          // Player is in deadzone - keep camera target stable
          camera.targetY = camera.y + (idealCameraY - camera.y) * 0.1; // Very slow drift
        }
      }
      
      // Use exponential smoothing for stable camera movement
      // This approach reduces jitter by smoothing both position and velocity
      const smoothing = camera.smoothing;
      
      // Calculate distance to target
      const diffX = camera.targetX - camera.x;
      const diffY = camera.targetY - camera.y;
      
      // Apply exponential smoothing to velocity
      // This creates a smooth acceleration/deceleration effect
      const targetVelocityX = diffX * (1 - smoothing) * 60; // Scale by 60 for frame-rate independence
      const targetVelocityY = diffY * (1 - smoothing) * 60;
      
      camera.velocityX += (targetVelocityX - camera.velocityX) * smoothing;
      camera.velocityY += (targetVelocityY - camera.velocityY) * smoothing;
      
      // Apply velocity to position
      camera.x += camera.velocityX * deltaTime;
      camera.y += camera.velocityY * deltaTime;
      
      // If very close to target, snap and stop velocity to prevent jitter
      if (Math.abs(diffX) < 1 && Math.abs(diffY) < 1) {
        camera.x = camera.targetX;
        camera.y = camera.targetY;
        camera.velocityX = 0;
        camera.velocityY = 0;
      }
      
      // Clamp camera to map bounds
      if (state.map) {
        const mapWidth = state.map.width * state.map.tilewidth * state.mapScale;
        const mapHeight = state.map.height * state.map.tileheight * state.mapScale;
        camera.x = Math.max(0, Math.min(mapWidth - canvasWidth, camera.x));
        camera.y = Math.max(0, Math.min(mapHeight - canvasHeight, camera.y));
      }
    };

    // Fixed timestep game loop for consistent 60fps
    const gameLoop = (currentTime) => {
      // If paused, only draw the current frame (no updates)
      if (isPaused) {
        // Still draw the map and players (frozen state)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (gameState.map && gameState.mapImage && gameState.mapCanvas) {
          drawMap(ctx, gameState, canvas);
        }

        if (!isTeacher) {
          drawPlayer(ctx, gameState);
        }

        drawOtherPlayers(ctx, gameState);

        if (isTeacher) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 32px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 4;
          ctx.strokeText('SPECTATOR MODE', canvas.width / 2 - 150, 50);
          ctx.fillText('SPECTATOR MODE', canvas.width / 2 - 150, 50);
          
          ctx.font = '18px Arial';
          ctx.strokeText('You are watching the game', canvas.width / 2 - 120, 100);
          ctx.fillText('You are watching the game', canvas.width / 2 - 120, 100);
        }
        
        // Schedule next frame even when paused (so UI remains responsive)
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (!gameState.lastTime) {
        gameState.lastTime = currentTime;
      }

      // Calculate frame delta
      let frameTime = currentTime - gameState.lastTime;
      gameState.lastTime = currentTime;

      // Cap frame time to prevent spiral of death
      const maxFrameTime = gameState.frameDuration * 5; // Max 5 frames worth
      if (frameTime > maxFrameTime) {
        frameTime = maxFrameTime;
      }

      // Add to accumulator
      gameState.accumulator += frameTime;

      // Update game logic at fixed timestep (60fps)
      const fixedDeltaTime = gameState.frameDuration / 1000; // Convert to seconds
      while (gameState.accumulator >= gameState.frameDuration) {
        // Update player (only for students) - this should be in fixed timestep
        if (!isTeacher) {
          updatePlayer(gameState, fixedDeltaTime);
        }

        gameState.accumulator -= gameState.frameDuration;
      }
      
      // Update camera once per frame (not in fixed timestep) for smoother movement
      // Use actual frame time for camera smoothing to avoid jitter
      const actualDeltaTime = frameTime / 1000; // Convert to seconds
      updateCamera(gameState, actualDeltaTime);

      // Clear canvas - save transform, reset, clear, restore
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw map
      if (gameState.map && gameState.mapImage && gameState.mapCanvas) {
        drawMap(ctx, gameState, canvas);
      } else {
        // Debug: show why map isn't drawing
        if (!gameState.map) console.warn('No map data');
        if (!gameState.mapImage) console.warn('No map image');
        if (!gameState.mapCanvas) console.warn('No map canvas');
      }

      // Draw player (only for students)
      if (!isTeacher) {
        drawPlayer(ctx, gameState);
      }

      // Draw other players
      drawOtherPlayers(ctx, gameState);

      // Draw spectator mode text for teachers
      if (isTeacher) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText('SPECTATOR MODE', canvas.width / 2 - 150, 50);
        ctx.fillText('SPECTATOR MODE', canvas.width / 2 - 150, 50);
        
        ctx.font = '18px Arial';
        ctx.strokeText('You are watching the game', canvas.width / 2 - 120, 100);
        ctx.fillText('You are watching the game', canvas.width / 2 - 120, 100);
      }

      // Schedule next frame and store reference for pause/resume
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    // Draw map
    const drawMap = (ctx, state, canvasElement) => {
      if (!state.mapCanvas) {
        console.warn('Map canvas not available in drawMap');
        return;
      }

      const dpr = state.dpr;
      const canvasWidth = canvasElement.width / dpr;
      const canvasHeight = canvasElement.height / dpr;
      
      // Save current transform
      ctx.save();
      
      // Reset transform to draw in device pixels
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      if (isTeacher) {
        // Teachers: draw entire map scaled to fit screen
        // Source: entire mapCanvas (device pixels)
        // Destination: entire canvas (device pixels)
        ctx.drawImage(
          state.mapCanvas,
          0, 0, // Source position (start of map)
          state.mapCanvas.width, state.mapCanvas.height, // Source size (entire map in device pixels)
          0, 0, // Destination position
          canvasElement.width, canvasElement.height // Destination size (entire canvas in device pixels)
        );
      } else {
        // Students: draw map with camera offset
        // Map canvas uses device pixels, so multiply camera position by dpr
        const sourceX = state.camera.x * dpr;
        const sourceY = state.camera.y * dpr;
        const sourceWidth = canvasWidth * dpr;
        const sourceHeight = canvasHeight * dpr;
        
        // Clamp source coordinates to map bounds
        const mapCanvasWidth = state.mapCanvas.width;
        const mapCanvasHeight = state.mapCanvas.height;
        const clampedSourceX = Math.max(0, Math.min(sourceX, mapCanvasWidth - sourceWidth));
        const clampedSourceY = Math.max(0, Math.min(sourceY, mapCanvasHeight - sourceHeight));
        const clampedSourceWidth = Math.min(sourceWidth, mapCanvasWidth - clampedSourceX);
        const clampedSourceHeight = Math.min(sourceHeight, mapCanvasHeight - clampedSourceY);
        
        ctx.drawImage(
          state.mapCanvas,
          clampedSourceX, clampedSourceY, // Source position in device pixels
          clampedSourceWidth, clampedSourceHeight, // Source size in device pixels
          0, 0, // Destination position
          canvasElement.width, canvasElement.height // Destination size in device pixels
        );
      }
      
      // Restore transform
      ctx.restore();
    };


    const boxesOverlap = (a, b) => {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    };

    // Update player
    const updatePlayer = (state, deltaTime) => {
    const player = state.player;
    player.velocityX = 0;
    player.velocityY = 0;
    let isMoving = false;

    if (questionLockRef.current) {
      return;
    }

    // LEFT
    if (state.keys['a']) {
      player.velocityX = -player.speed;
      isMoving = true;
      player.facingDirection = 'left';
    }

    // RIGHT
    if (state.keys['d']) {
      player.velocityX = player.speed;
      isMoving = true;
      player.facingDirection = 'right';
    }

    // UP
    if (state.keys['w']) {
      player.velocityY = -player.speed;
      isMoving = true;
      player.facingDirection = 'up';
    }

    // DOWN
    if (state.keys['s']) {
      player.velocityY = player.speed;
      isMoving = true;
      player.facingDirection = 'down';
    }

    // Move
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;

    // Keep player in bounds (use map bounds with zoom)
    if (state.map) {
      const mapWidth = state.map.width * state.map.tilewidth * state.mapScale;
      const mapHeight = state.map.height * state.map.tileheight * state.mapScale;
      player.x = Math.max(player.width / 2, Math.min(mapWidth - player.width / 2, player.x));
      player.y = Math.max(player.height / 2, Math.min(mapHeight - player.height / 2, player.y));
    } else {
      // Fallback to canvas bounds if map not loaded
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
      player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
    }

    if (!isTeacher && state.interactables && state.interactables.length && !questionLockRef.current) {
      const playerBounds = {
        x: player.x - player.width / 2,
        y: player.y - player.height / 2,
        width: player.width,
        height: player.height
      };

      const collided = state.interactables.find(
        (obj) =>
          !obj.triggered &&
          obj.width > 0 &&
          obj.height > 0 &&
          boxesOverlap(playerBounds, obj)
      );

      if (collided) {
        playSound('interact');
        collided.triggered = true;
        const questions = quizData?.questions || [];
        if (questions.length > 0) {
          const nextIndex = state.nextQuestionIndex % questions.length;
          const nextQuestion = questions[nextIndex];
          state.nextQuestionIndex = (state.nextQuestionIndex + 1) % questions.length;
          openQuestionModal(nextQuestion);
        } else {
          console.warn('No quiz questions available to display.');
        }
      }
    }

    // Animation timing (optimized for 60fps)
    player.animationFrame += deltaTime;

    if (isMoving) {
      player.direction = 'run';
      player.sprite = player.runSprite;

      // Run animation: 6 frames at ~10fps = 0.1s per frame, or 6 frames per second
      // At 60fps: 0.1s = 6 frames, so update every 6 game frames
      if (player.animationFrame >= 0.1) {
        player.currentFrame = (player.currentFrame + 1) % 6;
        player.animationFrame = 0;
      }
    } else {
      player.direction = 'idle';
      player.sprite = player.idleSprite;

      // Idle animation: 4 frames at ~6.67fps = 0.15s per frame
      // At 60fps: 0.15s = 9 frames, so update every 9 game frames
      if (player.animationFrame >= 0.15) {
        player.currentFrame = (player.currentFrame + 1) % 4;
        player.animationFrame = 0;
      }
    }

    // Send position updates (throttled) and always send direction/animation updates
    const now = performance.now();
    
    // Always send direction and animation frame updates (even when not moving)
    // This ensures teachers see the correct idle animation when students stop
    if (now - state.lastPositionUpdate > 100) {
      websocketService.sendPlayerMove({
        quizId,
        position: { x: player.x, y: player.y },
        direction: player.direction,
        facingDirection: player.facingDirection,
        currentFrame: player.currentFrame
      });
      state.lastPositionUpdate = now;
    }
  };


    // Draw player
    const drawPlayer = (ctx, state) => {
    const player = state.player;
    if (!player.sprite) return;

    const frameWidth = 16;
    const frameHeight = 32;

    // frame offset based on direction
    const offset = DIRECTION_OFFSETS[player.facingDirection] || 0;

    const sourceX = (player.currentFrame + offset) * frameWidth;
    const sourceY = 0;

    const destWidth = frameWidth * 2;
    const destHeight = frameHeight * 2;

    // Apply camera offset to player position
    const drawX = player.x - state.camera.x - destWidth / 2;
    const drawY = player.y - state.camera.y - destHeight / 2;

    // Get current player's name - try multiple sources
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;
    
    let playerName = 'Player';
    
    // First, try to get from players array (most reliable, has full name from API)
    const playerData = playersRef.current.find(p => (p.id || p._id) === currentUserId);
    if (playerData) {
      if (playerData.firstname && playerData.lastname) {
        playerName = `${playerData.firstname} ${playerData.lastname}`;
      } else if (playerData.firstname) {
        playerName = playerData.firstname;
      } else if (playerData.username) {
        playerName = playerData.username;
      }
    } else {
      // Fallback to localStorage user object (handle both camelCase and lowercase)
      const firstName = currentUser.firstName || currentUser.firstname;
      const lastName = currentUser.lastName || currentUser.lastname;
      if (firstName && lastName) {
        playerName = `${firstName} ${lastName}`;
      } else if (firstName) {
        playerName = firstName;
      } else if (currentUser.username) {
        playerName = currentUser.username;
      }
    }

    // Draw player name above sprite
    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Draw text with stroke for visibility
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(playerName, drawX + destWidth / 2, drawY - 5);
    
    ctx.fillStyle = 'white';
    ctx.fillText(playerName, drawX + destWidth / 2, drawY - 5);
    ctx.restore();

    ctx.drawImage(
      player.sprite,
      sourceX,
      sourceY,
      frameWidth,
      frameHeight,
      drawX,
      drawY,
      destWidth,
      destHeight
    );
  };

    // Draw other players
    const drawOtherPlayers = (ctx, state) => {
      Object.values(state.otherPlayers).forEach((otherPlayer) => {
        let drawX, drawY;
        
        if (isTeacher) {
          // For teachers: scale player positions to match full map view
          const dpr = state.dpr;
          const canvasWidth = canvas.width / dpr;
          const canvasHeight = canvas.height / dpr;
          
          if (state.map) {
            const mapPixelWidth = state.map.width * state.map.tilewidth * state.mapScale;
            const mapPixelHeight = state.map.height * state.map.tileheight * state.mapScale;
            
            // Scale player position from map coordinates to screen coordinates
            drawX = (otherPlayer.x / mapPixelWidth) * canvasWidth;
            drawY = (otherPlayer.y / mapPixelHeight) * canvasHeight;
          } else {
            drawX = otherPlayer.x;
            drawY = otherPlayer.y;
          }
        } else {
          // For students: apply camera offset to other player positions
          drawX = otherPlayer.x - state.camera.x;
          drawY = otherPlayer.y - state.camera.y;
        }
        
        // Get player name - prioritize playersRef for spectator view
        let playerName = 'Player';
        
        // First, try to find player name from players ref (most reliable source)
        const playerData = playersRef.current.find(p => {
          const pId = String(p.id || p._id || '');
          const otherId = String(otherPlayer.userId || '');
          return pId === otherId && pId !== '';
        });
        
        if (playerData) {
          // Found player data - use it
          if (playerData.firstname && playerData.lastname) {
            playerName = `${playerData.firstname} ${playerData.lastname}`;
            // Store it in otherPlayer for future use
            otherPlayer.firstname = playerData.firstname;
            otherPlayer.lastname = playerData.lastname;
          } else if (playerData.firstname) {
            playerName = playerData.firstname;
            otherPlayer.firstname = playerData.firstname;
          } else if (playerData.username) {
            playerName = playerData.username;
            otherPlayer.username = playerData.username;
          }
        } else if (otherPlayer.firstname && otherPlayer.lastname) {
          // Fallback to stored name in otherPlayer
          playerName = `${otherPlayer.firstname} ${otherPlayer.lastname}`;
        } else if (otherPlayer.firstname) {
          playerName = otherPlayer.firstname;
        } else if (otherPlayer.username) {
          playerName = otherPlayer.username;
        }
        
        // Use character sprites if available
        if (state.idleSprite && state.runSprite) {
          const frameWidth = 16;
          const frameHeight = 32;
          
          // Determine which sprite to use based on direction
          // Default to idle if direction is not set or is 'idle'
          const playerDirection = otherPlayer.direction || 'idle';
          const sprite = playerDirection === 'run' ? state.runSprite : state.idleSprite;
          
          // Use the synced currentFrame directly from the player
          let currentFrame = otherPlayer.currentFrame;
          if (currentFrame === undefined || currentFrame === null) {
            currentFrame = 0;
          }
          
          // Calculate frame offset based on facing direction
          const facingDir = otherPlayer.facingDirection || 'down';
          const offset = DIRECTION_OFFSETS[facingDir] || 0;
          
          const sourceX = (currentFrame + offset) * frameWidth;
          const sourceY = 0;
          
          const destWidth = frameWidth * 2;
          const destHeight = frameHeight * 2;
          
          // Draw player name above sprite
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          // Draw text with stroke for visibility
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(playerName, drawX, drawY - destHeight / 2 - 5);
          
          ctx.fillStyle = 'white';
          ctx.fillText(playerName, drawX, drawY - destHeight / 2 - 5);
          ctx.restore();
          
          // Draw the sprite
          ctx.drawImage(
            sprite,
            sourceX,
            sourceY,
            frameWidth,
            frameHeight,
            drawX - destWidth / 2,
            drawY - destHeight / 2,
            destWidth,
            destHeight
          );
        } else {
          // Fallback to rectangle if sprites not loaded
          // Draw player name above rectangle
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(playerName, drawX, drawY - otherPlayer.height / 2 - 5);
          
          ctx.fillStyle = 'white';
          ctx.fillText(playerName, drawX, drawY - otherPlayer.height / 2 - 5);
          ctx.restore();
          
          ctx.fillStyle = '#4ECDC4';
          ctx.fillRect(
            drawX - otherPlayer.width / 2,
            drawY - otherPlayer.height / 2,
            otherPlayer.width,
            otherPlayer.height
          );
        }
      });
    };


    // Start game loop with fixed timestep
    gameState.lastTime = null; // Will be set on first frame
    gameState.accumulator = 0;
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', updateCanvasSize);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      stopBackgroundMusic();
      websocketService.off('game-state-updated');
      websocketService.disconnect();
    };
  }, [quizId, navigate, isTeacher, isStudent, quizData, loading, isPaused, openQuestionModal, initAudioContext, playSound, startBackgroundMusic, stopBackgroundMusic]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining <= 0 || !gameReady) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Timer ended - handle game end
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameReady]); // Start when game becomes ready

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle pause (teacher only)
  const handlePause = () => {
    if (!isTeacher) return;
    
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    
    // Send pause/resume event to all players
    websocketService.sendGameState({
      quizId,
      gameState: { status: newPauseState ? 'paused' : 'resumed' }
    });
  };

  // Handle resume
  const handleResume = () => {
    setIsPaused(false);
    
    // Send resume event to all players
    websocketService.sendGameState({
      quizId,
      gameState: { status: 'resumed' }
    });
  };

  const handleExit = async () => {
    if (quizId) {
      websocketService.leaveQuizRoom(quizId);
    }
    websocketService.disconnect();
    
    // For students, navigate back to lobby and rejoin
    if (isStudent) {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Rejoin the lobby
          await axios.post(
            `http://localhost:5000/api/quiz/${quizId}/join`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      } catch (error) {
        console.error("Error rejoining lobby:", error);
        // Continue navigation even if rejoin fails
      }
      navigate(`/lobby/${quizId}`);
    } else {
      // For teachers, go back
      navigate(-1);
    }
  };

  return (
    <div className="phaser-game-wrapper">
      {/* Timer in top center */}
      {gameReady && timeRemaining > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 'clamp(10px, 2vh, 24px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: 'clamp(8px, 1.5vw, 16px) clamp(16px, 3vw, 28px)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: 'clamp(6px, 1vw, 12px)',
            fontSize: 'clamp(16px, 4vw, 28px)',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            border: '2px solid white',
            minWidth: 'clamp(120px, 35vw, 240px)',
            textAlign: 'center'
          }}
        >
          {formatTime(timeRemaining)}
        </div>
      )}
      
      {/* Pause button (teacher only) and Leave Game button in top right */}
      <div style={{
        position: 'fixed',
        top: 'clamp(12px, 2vh, 24px)',
        right: 'clamp(12px, 2vw, 24px)',
        zIndex: 1000,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(8px, 1.5vw, 14px)',
        alignItems: 'center',
        justifyContent: 'flex-end',
        maxWidth: '90vw'
      }}>
        {isTeacher && (
          <button 
            onClick={handlePause}
            style={{
              padding: 'clamp(8px, 1.5vw, 14px) clamp(14px, 2.5vw, 22px)',
              backgroundColor: isPaused ? '#ff9800' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 'clamp(4px, 0.7vw, 8px)',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 3vw, 16px)',
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = isPaused ? '#f57c00' : '#1976D2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isPaused ? '#ff9800' : '#2196F3'}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        )}
        <button 
          className="leave-game-btn" 
          onClick={handleExit}
          style={{
            padding: 'clamp(8px, 1.5vw, 14px) clamp(16px, 3vw, 24px)',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: 'clamp(4px, 0.7vw, 8px)',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 3vw, 16px)',
            fontWeight: 'bold',
            transition: 'background-color 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
        >
          Leave Game
        </button>
      </div>

      {/* Pause message in center when paused */}
      {isPaused && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 3vh, 24px)',
          width: 'min(90vw, 500px)'
        }}>
          <div style={{
            width: '100%',
            padding: 'clamp(16px, 3vw, 28px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '12px',
            fontSize: 'clamp(20px, 5vw, 32px)',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            border: '3px solid white'
          }}>
            GAME PAUSED
          </div>
          {isTeacher ? (
            <button
              onClick={handleResume}
              style={{
                width: '100%',
                padding: 'clamp(12px, 2.5vw, 20px)',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: 'clamp(16px, 4vw, 24px)',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              RESUME
            </button>
          ) : (
            <div style={{
              padding: 'clamp(12px, 2.5vw, 20px)',
              backgroundColor: 'rgba(255, 152, 0, 0.9)',
              color: 'white',
              borderRadius: '8px',
              fontSize: 'clamp(14px, 3.5vw, 20px)',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
              The game is being paused by the teacher
            </div>
          )}
        </div>
      )}
      <div className="phaser-game-container">
        {loading && <div className="loading">Loading quiz data...</div>}
        {!loading && !gameReady && <div className="loading">Loading game...</div>}
        <canvas
          ref={canvasRef}
          style={{
            width: '100vw',
            height: '100vh',
            display: gameReady ? 'block' : 'none',
            margin: 0,
            padding: 0
          }}
        />
      </div>

      {activeQuestion && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: 'clamp(12px, 4vw, 30px)'
          }}
        >
          <div
            style={{
              width: 'min(600px, 92vw)',
              maxHeight: '90vh',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: 'clamp(16px, 4vw, 28px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 'clamp(18px, 5vw, 26px)' }}>Quiz Question</h2>
            <p style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold' }}>{activeQuestion.questionText}</p>

            {renderQuestionControls()}

            {questionFeedback && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: questionFeedback === 'correct' ? '#e8f5e9' : '#ffebee',
                  color: questionFeedback === 'correct' ? '#2e7d32' : '#c62828',
                  fontWeight: 'bold'
                }}
              >
                {questionFeedback === 'correct'
                  ? 'Correct! Great job.'
                  : `Incorrect. Correct answer: ${activeQuestion.correctAnswer}`}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              {!questionFeedback ? (
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={
                    (activeQuestion.questionType === 'fill_in_the_blank'
                      ? selectedAnswer.trim().length === 0
                      : !selectedAnswer)
                  }
                  style={{
                    padding: 'clamp(10px, 2.5vw, 16px) clamp(18px, 3.5vw, 28px)',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor:
                      (activeQuestion.questionType === 'fill_in_the_blank'
                        ? selectedAnswer.trim().length === 0
                        : !selectedAnswer)
                        ? '#b0bec5'
                        : '#4CAF50',
                    color: '#fff',
                    fontSize: 'clamp(14px, 4vw, 18px)',
                    cursor:
                      (activeQuestion.questionType === 'fill_in_the_blank'
                        ? selectedAnswer.trim().length === 0
                        : !selectedAnswer)
                        ? 'not-allowed'
                        : 'pointer'
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeQuestionModal}
                  style={{
                    padding: 'clamp(10px, 2.5vw, 16px) clamp(18px, 3.5vw, 28px)',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    fontSize: 'clamp(14px, 4vw, 18px)',
                    cursor: 'pointer'
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;

