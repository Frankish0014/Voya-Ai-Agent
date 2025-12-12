
export interface ServiceData {
  restaurants: {
    name: string;
    location: string;
    wait_time: number;
    available_tables: number;
    price_level: string;
  }[];
  hotels: {
    name: string;
    rooms_available: number;
    services: string[];
    location: string;
  }[];
  taxi: {
    driver: string;
    eta: number;
  }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  groundingMetadata?: any; // For search results
  bookingPayload?: {
    category: 'stay' | 'dining' | 'delivery' | 'service';
    itemName: string;
    priceEstimate: string;
  };
}

export enum AppMode {
  HOME = 'HOME',
  LIVE = 'LIVE',
  VISION = 'VISION',
  GENERATE = 'GENERATE'
}
