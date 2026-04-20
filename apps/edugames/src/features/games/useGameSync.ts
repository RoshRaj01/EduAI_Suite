import { useEffect, useRef, useState, useCallback } from "react";
import { gameAPI, GameResponse } from "../../shared/utils/gameAPI";

interface GameUpdateMessage {
  type: string;
  [key: string]: any;
}

interface UseGameSyncOptions {
  sessionId: string;
  gameId: number;
  playerId: string;
  userType: "teacher" | "student";
  onGameUpdate?: (message: GameUpdateMessage) => void;
  onError?: (error: string) => void;
  pollingInterval?: number; // ms, for fallback polling
}

export const useGameSync = ({
  sessionId,
  gameId,
  playerId,
  userType,
  onGameUpdate,
  onError,
  pollingInterval = 2000,
}: UseGameSyncOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [gameState, setGameState] = useState<GameResponse | null>(null);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/games/chain-answer/${sessionId}?user_type=${userType}`;

      console.log("Connecting to WebSocket:", wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setUseWebSocket(true);

        // Send initial join message
        sendMessage({
          type: "join",
          player_id: playerId,
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message:", message);

          // Update game state based on message type
          if (message.type === "initial_state") {
            setGameState(message.game);
          } else if (message.type === "word_submitted") {
            // Update game state with new word
            if (gameState) {
              setGameState({
                ...gameState,
                // Chain will be updated through callback
              });
            }
          } else if (message.type === "game_started") {
            if (gameState) {
              setGameState({
                ...gameState,
                status: "active",
              });
            }
          } else if (message.type === "game_ended") {
            if (gameState) {
              setGameState({
                ...gameState,
                status: "completed",
              });
            }
          }

          // Call user callback
          if (onGameUpdate) {
            onGameUpdate(message);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setUseWebSocket(false);
        if (onError) {
          onError("WebSocket connection failed. Falling back to polling.");
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setUseWebSocket(false);
      if (onError) {
        onError("Failed to establish WebSocket connection");
      }
    }
  }, [sessionId, userType, playerId, gameState, onGameUpdate, onError]);

  // Send message via WebSocket
  const sendMessage = useCallback((message: GameUpdateMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Fallback polling function
  const startPolling = useCallback(() => {
    if (pollingTimer.current) return;

    const poll = async () => {
      try {
        const updatedGame = await gameAPI.getGameById(gameId);
        setGameState(updatedGame);

        // Emit update event
        if (onGameUpdate) {
          onGameUpdate({
            type: "game_state_update",
            game: updatedGame,
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingTimer.current = setInterval(poll, pollingInterval);
  }, [gameId, pollingInterval, onGameUpdate]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    // Try WebSocket first
    connectWebSocket();

    // Fallback to polling if WebSocket fails
    const fallbackTimer = setTimeout(() => {
      if (!useWebSocket) {
        console.log("Falling back to polling");
        startPolling();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      stopPolling();

      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket, useWebSocket, startPolling, stopPolling]);

  // Submit word
  const submitWord = useCallback(
    (word: string) => {
      if (useWebSocket && isConnected) {
        sendMessage({
          type: "submit_word",
          word,
          player_id: playerId,
        });
      } else {
        // Fallback: use REST API
        gameAPI.submitWord(gameId, word, playerId);
      }
    },
    [gameId, playerId, useWebSocket, isConnected, sendMessage],
  );

  // Start game (teacher only)
  const startGame = useCallback(() => {
    if (useWebSocket && isConnected) {
      sendMessage({
        type: "game_started",
      });
    }
  }, [useWebSocket, isConnected, sendMessage]);

  // End game (teacher only)
  const endGame = useCallback(() => {
    if (useWebSocket && isConnected) {
      sendMessage({
        type: "game_ended",
      });
    }
  }, [useWebSocket, isConnected, sendMessage]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const heartbeat = setInterval(() => {
      sendMessage({ type: "ping" });
    }, 30000); // 30 seconds

    return () => clearInterval(heartbeat);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    useWebSocket,
    gameState,
    submitWord,
    startGame,
    endGame,
    sendMessage,
  };
};
