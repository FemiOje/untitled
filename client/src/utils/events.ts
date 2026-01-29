/**
 * Event Processing Utilities
 *
 * Handle transaction events and translate them to GameEvent types
 * Following death-mountain pattern for event processing
 */

import { GameEvent, Direction, Position, Moves } from "@/types/game";
import { debugLog } from "./helpers";

/**
 * Process raw game event from contract
 * Translates contract events into typed GameEvent objects
 *
 * @param event - Raw event from contract
 * @returns Typed GameEvent object
 */
export function processGameEvent(event: any): GameEvent {
  try {
    // Handle different event structures
    const eventData = event.data || event;
    const eventKeys = event.keys || [];

    // Determine event type from keys or data structure
    if (!eventData || typeof eventData !== "object") {
      return { type: "unknown" };
    }

    // Check for spawned event
    if (eventData.type === "spawned" || eventKeys.includes("spawned")) {
      return {
        type: "spawned",
        player: eventData.player || eventKeys[1],
        position: eventData.position
          ? {
              player: eventData.player,
              vec: {
                x: eventData.position.x || 0,
                y: eventData.position.y || 0,
              },
            }
          : undefined,
      };
    }

    // Check for moved event
    if (eventData.type === "moved" || eventKeys.includes("moved")) {
      return {
        type: "moved",
        player: eventData.player || eventKeys[1],
        direction: eventData.direction as Direction,
        position: eventData.position,
      };
    }

    // Check for position update
    if (eventData.type === "position_update" || eventData.position) {
      return {
        type: "position_update",
        player: eventData.player,
        position: eventData.position,
      };
    }

    return { type: "unknown" };
  } catch (error) {
    console.error("Error processing game event:", error);
    return { type: "unknown" };
  }
}

/**
 * Translate game event from transaction receipt
 * Maps raw transaction events to typed GameEvent objects
 *
 * @param event - Raw event from transaction receipt
 * @param manifest - Contract manifest for event lookup
 * @returns Typed GameEvent or null
 */
export function translateGameEvent(
  event: any,
  manifest: any
): GameEvent | null {
  try {
    if (!event || !event.keys || event.keys.length === 0) {
      return null;
    }

    // Extract event selector (first key)
    const eventSelector = event.keys[0];

    // Parse event data based on selector
    // This would match against known event selectors from the manifest
    // For now, we'll use a simple approach based on data structure

    const processedEvent = processGameEvent(event);

    if (processedEvent.type !== "unknown") {
      debugLog("Translated event:", processedEvent);
      return processedEvent;
    }

    return null;
  } catch (error) {
    console.error("Error translating game event:", error);
    return null;
  }
}

/**
 * Extract valid game events from transaction receipt
 * Filters and processes events from transaction execution
 *
 * @param receipt - Transaction receipt
 * @param manifest - Contract manifest
 * @returns Array of valid GameEvent objects
 */
export function extractGameEvents(
  receipt: any,
  manifest: any
): GameEvent[] {
  try {
    if (!receipt || !receipt.events) {
      return [];
    }

    const translatedEvents = receipt.events
      .map((event: any) => translateGameEvent(event, manifest))
      .filter((event: GameEvent | null): event is GameEvent => event !== null);

    debugLog(`Extracted ${translatedEvents.length} game events from receipt`);

    return translatedEvents;
  } catch (error) {
    console.error("Error extracting game events:", error);
    return [];
  }
}

/**
 * Get event icon/image based on event type
 * @param event - GameEvent object
 * @returns Icon/image path
 */
export function getEventIcon(event: GameEvent): string {
  switch (event.type) {
    case "spawned":
      return "/icons/spawn.svg";
    case "moved":
      return "/icons/move.svg";
    case "position_update":
      return "/icons/position.svg";
    default:
      return "/icons/default.svg";
  }
}

/**
 * Get human-readable event title
 * @param event - GameEvent object
 * @returns Event title string
 */
export function getEventTitle(event: GameEvent): string {
  switch (event.type) {
    case "spawned":
      return "Player Spawned";
    case "moved":
      return event.direction
        ? `Moved ${getDirectionName(event.direction)}`
        : "Player Moved";
    case "position_update":
      return "Position Updated";
    default:
      return "Unknown Event";
  }
}

/**
 * Get direction name from Direction enum
 * @param direction - Direction enum value
 * @returns Direction name string
 */
function getDirectionName(direction: Direction): string {
  const names: Record<Direction, string> = {
    [Direction.East]: "East",
    [Direction.NorthEast]: "Northeast",
    [Direction.NorthWest]: "Northwest",
    [Direction.West]: "West",
    [Direction.SouthWest]: "Southwest",
    [Direction.SouthEast]: "Southeast",
  };
  return names[direction] || "Unknown";
}

/**
 * Check if event is a fatal error
 * @param event - GameEvent object
 * @returns True if fatal error
 */
export function isFatalError(event: GameEvent): boolean {
  // In the future, check for specific error event types
  return false;
}

/**
 * Batch process multiple events
 * @param events - Array of raw events
 * @param manifest - Contract manifest
 * @returns Array of processed GameEvent objects
 */
export function batchProcessEvents(
  events: any[],
  manifest: any
): GameEvent[] {
  return events
    .map((event) => translateGameEvent(event, manifest))
    .filter((event): event is GameEvent => event !== null);
}
