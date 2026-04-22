import { useEffect, useRef, useState, useCallback } from "react";
import { gameAPI, API_BASE_URL } from "../../shared/utils/gameAPI";
import type { GameResponse } from "../../shared/utils/gameAPI";

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
  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [gameState, setGameState] = useState<GameResponse | null>(null);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const cleanUrl = API_BASE_URL.trim();
      const backendUrl = new URL(cleanUrl);
      const wsProtocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${backendUrl.host}/ws/games/chain-answer/${sessionId}?user_type=${userType}`;

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
            const chain = message.chain || [];
            const players = message.players || [];

            // Calculate current player index based on last word in chain
            let currentPlayerIndex = 0;
            if (chain.length > 0) {
              const lastWord = chain[chain.length - 1];
              const lastPlayerIndex = players.findIndex(
                (p: any) =>
                  String(p.student_id) === String(lastWord.submitted_by),
              );
              if (lastPlayerIndex !== -1) {
                currentPlayerIndex = (lastPlayerIndex + 1) % players.length;
              }
            }

            setGameState({
              ...message.game,
              players: players,
              words: chain,
              chain: chain,
              currentPlayerIndex,
              timer: 30,
            });
          } else if (message.type === "word_submitted") {
            // Update game state with new word
            setGameState((prev) => {
              if (!prev) return null;
              const newWords = [...(prev.words || []), message.word];

              // Calculate next player index
              const lastPlayerIndex = prev.players.findIndex(
                (p: any) =>
                  String(p.client_id || p.student_id) ===
                  String(message.word.submitted_by),
              );
              const nextPlayerIndex =
                lastPlayerIndex !== -1
                  ? (lastPlayerIndex + 1) % prev.players.length
                  : prev.currentPlayerIndex || 0;

              const newPlayers = prev.players.map((p: any) => {
                if (
                  String(p.student_id) === String(message.word.submitted_by)
                ) {
                  return {
                    ...p,
                    ...message.player_stats,
                  };
                }
                return p;
              });
              return {
                ...prev,
                words: newWords,
                chain: newWords,
                players: newPlayers,
                currentPlayerIndex: nextPlayerIndex,
                timer: 30, // Reset timer for next player
              };
            });
          } else if (message.type === "game_started") {
            setGameState((prev) =>
              prev
                ? {
                    ...prev,
                    status: "active",
                    timer: 30,
                    currentPlayerIndex: 0,
                  }
                : null,
            );
          } else if (message.type === "game_ended") {
            setGameState((prev) =>
              prev ? { ...prev, status: "completed" } : null,
            );
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
  }, [sessionId, userType, playerId, onGameUpdate, onError]);

  // Send message via WebSocket
  const sendMessage = useCallback((message: GameUpdateMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Fallback polling function
  const startPolling = useCallback(() => {
    if (pollingTimer.current) return;
    if (gameId <= 0 && !sessionId) return;

    const poll = async () => {
      try {
        const updatedGame =
          gameId > 0
            ? await gameAPI.getGameById(gameId)
            : await gameAPI.getGameBySessionId(sessionId);
        setGameState(updatedGame);

        // Emit update event
        if (onGameUpdate) {
          onGameUpdate({
            type: "game_state_update",
            game: updatedGame,
          });
        }
      } catch (error: any) {
        console.error("Polling error:", error);
        if (error.message?.includes("Not Found")) {
          stopPolling();
          if (onError) onError("Game session not found. Please rejoin.");
        }
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingTimer.current = setInterval(poll, pollingInterval);
  }, [gameId, sessionId, pollingInterval, onGameUpdate]);

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

  // Timer countdown effect
  useEffect(() => {
    if (
      !gameState ||
      gameState.status !== "active" ||
      (gameState.timer || 0) <= 0
    )
      return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev || (prev.timer || 0) <= 0) return prev;
        return {
          ...prev,
          timer: (prev.timer || 0) - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.status, gameState?.timer]);

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
