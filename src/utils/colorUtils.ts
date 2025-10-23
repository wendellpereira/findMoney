/**
 * Generate a deterministic color from a category name
 * Same input always produces the same color
 */
export function getCategoryColor(categoryName: string): string {
  // Hash function to convert string to number
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Use hash to generate hue (0-360)
  const hue = Math.abs(hash) % 360

  // Return HSL color string
  // Using 70% saturation and 60% lightness for good visibility
  return `hsl(${hue}, 70%, 60%)`
}

/**
 * Generate a hex color from a category name (alternative format)
 */
export function getCategoryColorHex(categoryName: string): string {
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  // Convert hash to hex color
  const color = (Math.abs(hash) % 16777215).toString(16)
  return '#' + ('000000' + color).slice(-6)
}
