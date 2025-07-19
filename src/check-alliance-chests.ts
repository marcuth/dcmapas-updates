import { abbreviateNumber } from "js-abbreviation-number"
import * as dateFns from "date-fns"
import { Telegraf } from "telegraf"
import fs from "fs/promises"

import { AllianceChest, AllianceChestResponse, Gatcha, RewardSet } from "./interfaces/alliance-chests"
import { fetchLocalization, LocalizationObject } from "./utils/fetch-localization"
import { fetchDitelp } from "./utils/fetch-ditlep"
import { config } from "./config"

function findTodayAllianceChest(data: AllianceChestResponse) {
    const today = new Date()

    for (const range of data.dateRanges) {
        const rangeStartDate = new Date(range.start)
        const rangeEndDate = new Date(range.end)

        const rangeAcceptableStart = new Date(rangeStartDate)
        rangeAcceptableStart.setHours(0, 0, 0, 0)

        const rangeAcceptableEnd = new Date(rangeAcceptableStart)
        rangeAcceptableEnd.setDate(rangeAcceptableEnd.getDate() + 1)

        if (dateFns.isWithinInterval(today, { start: rangeStartDate, end: rangeAcceptableEnd })) {
            return {
                id: String(range.chestId),
                startAt: rangeStartDate.toISOString(),
                endAt: rangeEndDate.toISOString()
            }
        }
    }

    return null
}


type RewardDetails = {
    type: string
    quantity: number
}

function getRewardDetails(
    chestData: AllianceChest,
    allRewardSets: RewardSet[],
    allGatcha: Gatcha[]
) {
    const rewards: RewardDetails[] = []

    const rewardSetId = chestData.reward_set
    const gatchaIds = allRewardSets.find(rewardSet => rewardSet.id === rewardSetId)?.gatcha_ids ?? []

    for (const gatchaId of gatchaIds) {
        const gatchaEntry = allGatcha.find(gatcha => gatcha.gatcha_id === gatchaId)

        if (gatchaEntry && gatchaEntry.resource) {
            if (gatchaEntry.resource.seeds) {
                rewards.push({
                    type: "seeds",
                    quantity: gatchaEntry.resource.seeds[0]?.amount || 0
                })
            } else if (gatchaEntry.resource.f) {
                rewards.push({
                    type: "food",
                    quantity: gatchaEntry.resource.f
                })
            } else if (gatchaEntry.resource.c) {
                rewards.push({
                    type: "gems",
                    quantity: gatchaEntry.resource.c
                })
            } else if (gatchaEntry.resource.keys) {
                rewards.push({
                    type: "keys",
                    quantity: gatchaEntry.resource.keys
                })
            } else if (gatchaEntry.resource.trade_tickets) {
                rewards.push({
                    type: "trade_tickets",
                    quantity: gatchaEntry.resource.trade_tickets[0]?.amount || 0
                })
            } else if (gatchaEntry.resource.rarity_seeds) {
                rewards.push({
                    type: "rarity_seeds",
                    quantity: gatchaEntry.resource.rarity_seeds[0]?.amount || 0
                })
            }
        }
    }

    if (rewards.length === 0) {
        throw new Error("Nenhuma recompensa encontrada")
    }

    return rewards
}


async function checkTodayAllianceChest(data: AllianceChestResponse, localization: LocalizationObject) {
    const chest = findTodayAllianceChest(data)

    if (!chest) {
        console.log("Nenhum ID de baú de aliança encontrado para hoje.")
        return null
    }

    const chestData = data.allianceChest[chest.id]

    if (!chestData) {
        console.log(`Dados do baú de aliança não encontrados para o ID: ${chest.id}`)
        return null
    }

    const activityName = localization[chestData.activity_name_tid]
    const rewardDeatils = getRewardDetails(chestData, data.rewardSet, data.gatcha)

    return {
        startAt: chest.startAt,
        endAt: chest.endAt,
        type: chestData.activity,
        activity: activityName,
        rewards: rewardDeatils
    }
}

function formatRewardType(type: string) {
    const map: Record<string, string> = {
        seeds: "Esferas de dragão",
        food: "Comida",
        gems: "Joias",
        keys: "Chaves",
        trade_tickets: "Essências de troca",
        rarity_seeds: "Esferas de raridade"
    }

    if (!map[type]) {
        return type
    }

    return map[type]
}

function formatRewardDetails(rewards: RewardDetails[]) {
    return rewards.map(reward => `- ${abbreviateNumber(reward.quantity)} ${formatRewardType(reward.type)}`).join("\n")
}

async function main() {
    const bot = new Telegraf(config.telegram.botToken)
    const today = new Date()
    const currentMonth = today.getMonth() + 1

    const data = await fetchDitelp<AllianceChestResponse>({
        path: "AllianceChest/Get",
        decrypt: true,
        params: {
            month: currentMonth
        }
    })

    const localization = await fetchLocalization(config.localization.language)

    await fs.writeFile("alliance-chests.json", JSON.stringify(data, null, 4))
    const allianceChest = await checkTodayAllianceChest(data, localization)

    if (allianceChest) {
        const formattedStartDate = dateFns.format(new Date(allianceChest.startAt), "dd-MM")
        const formattedEndDate = dateFns.format(new Date(allianceChest.endAt), "dd-MM")
        const duration = dateFns.differenceInDays(new Date(allianceChest.endAt), new Date(allianceChest.startAt))
        const targetScorePerMemberPerDay = 2500
        const targetScorePerMemberTotal = targetScorePerMemberPerDay * duration
        const membersPerAlliance = 20
        const totalChestScore = membersPerAlliance * targetScorePerMemberTotal

        const message = `🇧🇷 | Novo Baú de Alianças!\n\n- 🎯 Atividade: ${allianceChest.activity}\n- ⌛️ Período: de ${formattedStartDate} até ${formattedEndDate} (${duration} dias)\n- 👥 Meta total: ${abbreviateNumber(totalChestScore)}\n- 👤 Meta individual: ${abbreviateNumber(targetScorePerMemberTotal)}\n\n📦 Recompensas de baú nível 6\n\n${formatRewardDetails(allianceChest.rewards)}`

        await bot.telegram.sendMessage(config.telegram.updatesChannelId, message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "☕️ Doe via Buy me a Coffe", url: "https://buymeacoffee.com/marcuth" }
                    ],
                    [
                        { text: "❤️ Doe via Ko-fi", url: "https://ko-fi.com/marcuth" }
                    ],
                    [
                        { text: "💠 Doe via Livepix", url: "https://livepix.gg/marcuth" }
                    ]
                ]
            }
        })
    }
}

if (require.main === module) {
    main()
}