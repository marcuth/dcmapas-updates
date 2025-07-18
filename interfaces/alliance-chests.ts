export interface AllianceChestResponse {
    weeks: Weeks
    allianceChest: AllianceChests
    rewardSet: RewardSet[]
    gatcha: Gatcha[]
    dateRanges: DateRange[]
}

export interface Weeks {
    [key: string]: Week
}

export interface Week {
    id: number
    tuesday: number
    wednesday: number
    thursday: number
    saturday: number
    sunday: number
    start_ts: number
    startOn: string
}

export interface AllianceChests {
    [key: string]: AllianceChest
}

export interface AllianceChest {
    id: number
    activity: string
    level_set: number
    reward_set: number
    chest_reward_asset: ChestRewardAsset[]
    activity_name_tid: string
}

export interface RaritySeed {
    rarity: string
    amount: number
}

export interface ChestRewardAsset {
    rarity_seeds?: RaritySeed[]
    egg?: number
    c?: number
    f?: number
}

export interface RewardSet {
    id: number
    level: number
    gatcha_ids: number[]
}

export interface Gatcha {
    id: number
    gatcha_id: number
    resource: Resource
}

export interface Resource {
    rarity_seeds?: RaritySeed[]
    trade_tickets?: TradeTicket[]
    f?: number
    c?: number
    keys?: number
    seeds?: Seed[]
}

export interface TradeTicket {
    rarity: string
    amount: number
}

export interface Seed {
    rarity: string
    id: number
    amount: number
}

export interface DateRange {
    start: string
    end: string
    duration: number
    chestId: number
}
