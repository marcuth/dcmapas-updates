import axios from "axios"

export type LocalizationArray = Record<string, string>[]

export type LocalizationObject = Record<string, string>

export async function fetchLocalization(language: string): Promise<LocalizationObject> {
    const url = `http://sp-translations.socialpointgames.com/deploy/dc/ios/prod/dc_ios_${language}_prod_wetd46pWuR8J5CmS.json`
    const response = await axios.get(url)
    const data = response.data as LocalizationArray
    const localization = Object.assign({}, ...data)
    return localization
}