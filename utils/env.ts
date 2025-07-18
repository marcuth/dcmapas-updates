import dotenv from "dotenv"

dotenv.config({ quiet: true })

export function env(name: string, shouldExist?: true): string
export function env(name: string, shouldExist: false): string | undefined
export function env(name: string, shouldExist = true): string | undefined {
    const value = process.env[name]

    if (!value && shouldExist) {
        throw new Error(`Environment variable ${name} is missing`)
    }

    return value
}