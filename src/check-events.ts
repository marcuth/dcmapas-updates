import * as dateFns from "date-fns"
import { Telegraf } from "telegraf"

import { fetchLocalization, LocalizationObject } from "./utils/fetch-localization"
import { AllEventsResponse, Event } from "./interfaces/all-events"
import { toTitleCase } from "./utils/to-title-case"
import { fetchDitelp } from "./utils/fetch-ditlep"
import { config } from "./config"

/*
enum EventType {
    FogIslands = 1,
    HeroicRaces = 4,
    MazeIslands = 5
}
*/

function filterTodayEvents(events: Event[]) {
    const today = new Date()

    return events.filter(event =>
        dateFns.isSameDay(dateFns.fromUnixTime(event.startTs), today)
    )
}

function normalizeEvents(events: Event[], ditlepLocalization: LocalizationObject, localization: LocalizationObject) {
    return events.map(event => {
        let translatedTitle: string

        if (event.title.includes("Heroic Race")) {
            const [dragonName, eventTitle] = event.title.split("  ")
            const matchedEventTitleKey = Object.keys(ditlepLocalization).find(key => ditlepLocalization[key] === eventTitle)
            const matchedDragonNameKey = Object.keys(localization).find(key => ditlepLocalization[key] === `${dragonName} Dragon`)
            translatedTitle = matchedEventTitleKey && matchedDragonNameKey ? `${localization[matchedEventTitleKey]} do ${localization[matchedDragonNameKey]}` : event.title
        } else {
            const ditlepTitle = event.title
            const matchedKey = Object.keys(ditlepLocalization).find(key => ditlepLocalization[key] === ditlepTitle)
            translatedTitle = matchedKey ? localization[matchedKey] || ditlepTitle : ditlepTitle
        }

        return {
            index: event.index,
            type: event.eventType,
            title: toTitleCase(translatedTitle),
            startAt: new Date(event.startTs * 1000).toISOString(),
            endAt: new Date(event.endTs * 1000).toISOString()
        }
    })
}

async function main() {
    const bot = new Telegraf(config.telegram.botToken)

    const data = await fetchDitelp<AllEventsResponse>({
        path: "Dashboard/GetAllEvents",
        method: "POST"
    })

    const ditlepLocalization = await fetchLocalization(config.localization.ditlepLanguage)
    const localization = await fetchLocalization(config.localization.language)
    const allEvents = data.currentEvents.concat(data.upcomingEvents).map((event, index) => ({ ...event, index }))
    const todayEvents = filterTodayEvents(allEvents)
    const normalizedEvents = normalizeEvents(todayEvents, ditlepLocalization, localization)

    for (const event of normalizedEvents) {
        const formattedStartDate = dateFns.format(new Date(event.startAt), "dd-MM 'às' HH:mm")
        const formattedEndDate = dateFns.format(new Date(event.endAt), "dd-MM 'às' HH:mm")
        const duration = dateFns.differenceInCalendarDays(new Date(event.endAt), new Date(event.startAt))

        const message = `🇧🇷 | Atenção! O evento *${event.title}* começa hoje!\n\n📅 Período: ${formattedStartDate} até ${formattedEndDate}  \n⌛ Duração: ${duration} dias`

        await bot.telegram.sendMessage(config.telegram.updatesChannelId, message, {
            parse_mode: "Markdown",
        })
    }
}

if (require.main === module) {
    main()
}