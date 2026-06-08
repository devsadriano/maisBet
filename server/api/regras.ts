import fs from 'fs'
import path from 'path'
import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const isCopa = query.isCopa === 'true'
  
  const fileName = isCopa ? 'regras_copamundo.md' : 'regras_bet.md'
  const filePath = path.join(process.cwd(), '.github', 'instructions', fileName)
  
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    return { content }
  } catch (error: any) {
    console.error('Error reading rules file:', error)
    throw createError({
      statusCode: 404,
      statusMessage: `Rules file not found: ${fileName}. Ensure it exists in .github/instructions/`,
    })
  }
})
