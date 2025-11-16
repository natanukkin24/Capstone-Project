import React, { useEffect, useRef, useState } from 'react';
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
      setPlayers(prev => [...prev, data]);
    });

    websocketService.on('player-left', (data) => {
      console.log('Player left:', data);
      setPlayers(prev => prev.filter(p => p.userId !== data.userId));
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
      if (gameStateRef.current && data.position) {
        gameStateRef.current.updatePlayerPosition({
          userId: data.userId || data.id,
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
          this.otherPlayers[userId] = {
            x: position.x,
            y: position.y,
            width: 32,
            height: 32,
            userId: userId,
            facingDirection: facingDirection || 'down',
            direction: direction || 'idle',
            currentFrame: currentFrame || 0,
            lastUpdateTime: performance.now()
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

        // Calculate scale - teachers see full map, students zoom in
        const mapWidth = mapData.width * mapData.tilewidth;
        const mapHeight = mapData.height * mapData.tileheight;
        const scaleX = canvas.width / mapWidth;
        const scaleY = canvas.height / mapHeight;
        const baseScale = Math.max(scaleX, scaleY);
        
        if (isTeacher) {
          // Teachers see entire map
          gameState.mapScale = baseScale;
        } else {
          // Students zoom in 1.5x
          gameState.mapScale = baseScale * 1.5;
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
      if (isTeacher) return; // Teachers can't control
      gameState.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      if (isTeacher) return;
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
        // For teachers: disable camera movement, show entire map
        camera.x = 0;
        camera.y = 0;
        camera.targetX = 0;
        camera.targetY = 0;
        camera.velocityX = 0;
        camera.velocityY = 0;
        return; // Skip camera smoothing for teachers
      } else {
        // For students: follow their own player with a deadzone
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

      requestAnimationFrame(gameLoop);
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


    // Update player
    const updatePlayer = (state, deltaTime) => {
    const player = state.player;
    player.velocityX = 0;
    player.velocityY = 0;
    let isMoving = false;

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
    const animationId = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
      websocketService.disconnect();
    };
  }, [quizId, navigate, isTeacher, isStudent, quizData, loading]);

  const handleExit = () => {
    if (quizId) {
      websocketService.leaveQuizRoom(quizId);
    }
    websocketService.disconnect();
    navigate(-1);
  };

  return (
    <div className="phaser-game-wrapper">
      <button 
        className="leave-game-btn" 
        onClick={handleExit}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
      >
        Leave Game
      </button>
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
    </div>
  );
};

export default Game;

