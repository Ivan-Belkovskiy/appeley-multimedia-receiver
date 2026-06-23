export const centerMainText = (text: string, displayLength: number = 16): string[] => {
  if (text.length >= displayLength) {
    return text.substring(0, displayLength).split('');
  }

  const totalSpaces = displayLength - text.length;

  const leftPadding = Math.floor(totalSpaces / 2);

  const centeredText = text
    .padStart(leftPadding + text.length, " ")
    .padEnd(displayLength, " ");              

  return centeredText.split('');
};