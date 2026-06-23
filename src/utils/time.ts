export const formatTime = (input: number) => {
    const minutes = String(Math.floor(Math.floor(input) / 60));
    const seconds = String(Math.floor(Math.floor(input) % 60));
    return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
}

export const timeFromDate = (date: Date, withSeparator?: boolean) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}${(withSeparator) ? ":" : " "}${minutes}`;
}