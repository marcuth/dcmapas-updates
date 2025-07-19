export interface AllEventsResponse {
    currentEvents: Event[]
    upcomingEvents: Event[]
}

export interface Event {
    id?: string
    title: string
    startTs: number
    endTs: number
    eventType: number
    isValid: boolean
    timeLeft?: number
    [key: string]: any
}
