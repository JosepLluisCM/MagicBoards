export function formatDate(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "";
  }

  const dateFormatted = date.toLocaleDateString();
  const timeFormatted = date.toLocaleTimeString();

  //Browser locale settings
  return `${dateFormatted} ${timeFormatted}`;
}
