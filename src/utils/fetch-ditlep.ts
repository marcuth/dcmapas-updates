import axios, { AxiosRequestConfig } from "axios"
import crypto from "node:crypto"

import { config } from "../config"

type FetchDitlepOptions<D> = Omit<AxiosRequestConfig<D>, "url"> & {
    path: string
    decrypt?: boolean
}

function decryptDitelpData(data: string) {
    const iv = Buffer.from(config.ditlep.encryptionIv, "hex")
    const key = Buffer.from(config.ditlep.encryptionKey, "hex")
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
    return JSON.parse(decipher.update(data, "base64", "utf8") + decipher.final("utf8"))
}

export async function fetchDitelp<D extends any>({
    path,
    decrypt = false,
    ...options
}: FetchDitlepOptions<any>) {
    const url = `https://www.ditlep.com/${path}`
    const response = await axios.get(url, options)
    return (decrypt ? decryptDitelpData(response.data) : response.data) as D
}