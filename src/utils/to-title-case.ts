export function toTitleCase(text: string) {
    return text.toLowerCase().replace(/(?:^|\s)\S/g, function (match) {
        return match.toUpperCase()
    })
}