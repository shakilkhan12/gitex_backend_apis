// In-memory buffer for QMS stream events

interface StoredEvent {
  timestamp: Date;
  receivedAt: Date;
  srcIndex: string;
  srcName: string;
  eventType: number;
  data: any;
  fullPayload: any;
}

class EventBufferService {
  private static eventBuffer: Map<string, StoredEvent[]> = new Map();
  private static readonly MAX_EVENT_AGE = 60 * 60 * 1000;
  private static readonly MAX_EVENTS_PER_SRC = 100;
  private static cleanupInterval: NodeJS.Timeout | null = null;

  public static initialize() {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldEvents();
      }, 5 * 60 * 1000);
      console.log('[EventBufferService] Initialized');
    }
  }

  public static storeEvent(eventData: any): void {
    try {
      const event = eventData?.event;
      if (!event || !event.params || !event.params.events || event.params.events.length === 0) {
        return;
      }

      for (const evt of event.params.events) {
        const srcIndex = evt.srcIndex;
        if (!srcIndex) continue;

        const storedEvent: StoredEvent = {
          timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
          receivedAt: eventData.receivedAt ? new Date(eventData.receivedAt) : new Date(),
          srcIndex: srcIndex,
          srcName: evt.srcName || 'Unknown',
          eventType: evt.eventType || 0,
          data: evt.data || {},
          fullPayload: eventData
        };

        if (!this.eventBuffer.has(srcIndex)) {
          this.eventBuffer.set(srcIndex, []);
        }

        const events = this.eventBuffer.get(srcIndex)!;
        events.push(storedEvent);

        if (events.length > this.MAX_EVENTS_PER_SRC) {
          events.shift();
        }
      }
    } catch (error: any) {
      console.error('[EventBufferService] Error storing event:', error.message);
    }
  }

  public static getLatestEventBySrcIndex(srcIndex: string, maxAgeSeconds: number = 3600): StoredEvent | null {
    try {
      const events = this.eventBuffer.get(srcIndex);
      if (!events || events.length === 0) return null;

      const latestEvent = events[events.length - 1];
      const eventAge = Date.now() - latestEvent.receivedAt.getTime();
      
      if (eventAge > maxAgeSeconds * 1000) return null;

      return latestEvent;
    } catch (error: any) {
      return null;
    }
  }

  public static getAllEventsBySrcIndex(srcIndex: string, maxAgeSeconds: number = 3600): StoredEvent[] {
    try {
      const events = this.eventBuffer.get(srcIndex);
      if (!events || events.length === 0) return [];

      const cutoffTime = Date.now() - (maxAgeSeconds * 1000);
      return events.filter(event => event.receivedAt.getTime() > cutoffTime);
    } catch (error: any) {
      return [];
    }
  }

  public static getLatestEventFromMultipleSources(srcIndexes: string[], maxAgeSeconds: number = 3600): StoredEvent | null {
    try {
      let latestEvent: StoredEvent | null = null;
      let latestTimestamp = 0;

      for (const srcIndex of srcIndexes) {
        const event = this.getLatestEventBySrcIndex(srcIndex, maxAgeSeconds);
        if (event && event.receivedAt.getTime() > latestTimestamp) {
          latestEvent = event;
          latestTimestamp = event.receivedAt.getTime();
        }
      }

      return latestEvent;
    } catch (error: any) {
      return null;
    }
  }

  private static cleanupOldEvents(): void {
    try {
      const cutoffTime = Date.now() - this.MAX_EVENT_AGE;
      const entries = Array.from(this.eventBuffer.entries());

      for (const [srcIndex, events] of entries) {
        const recentEvents = events.filter((event: StoredEvent) => 
          event.receivedAt.getTime() > cutoffTime
        );

        if (recentEvents.length === 0) {
          this.eventBuffer.delete(srcIndex);
        } else if (recentEvents.length < events.length) {
          this.eventBuffer.set(srcIndex, recentEvents);
        }
      }
    } catch (error: any) {
      console.error('[EventBufferService] Cleanup error:', error.message);
    }
  }

  public static getBufferStats(): {
    totalSources: number;
    totalEvents: number;
    sources: { srcIndex: string; eventCount: number; oldestEvent: Date; newestEvent: Date }[];
  } {
    const stats = {
      totalSources: this.eventBuffer.size,
      totalEvents: 0,
      sources: [] as { srcIndex: string; eventCount: number; oldestEvent: Date; newestEvent: Date }[]
    };

    const entries = Array.from(this.eventBuffer.entries());
    for (const [srcIndex, events] of entries) {
      stats.totalEvents += events.length;
      
      if (events.length > 0) {
        stats.sources.push({
          srcIndex,
          eventCount: events.length,
          oldestEvent: events[0].receivedAt,
          newestEvent: events[events.length - 1].receivedAt
        });
      }
    }

    return stats;
  }

  public static clearBuffer(): void {
    this.eventBuffer.clear();
  }

  public static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export default EventBufferService;

