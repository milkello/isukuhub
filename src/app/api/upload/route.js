// Import Next.js server-side utilities
import { NextResponse } from 'next/server'

// Import Node.js built-in file system promises API
import { promises as fs } from 'fs'

// Import Node.js path module
import path from 'path'

// Define the runtime environment for this API route
export const runtime = 'nodejs'

// Define how Next.js should handle dynamic imports for this API route
export const dynamic = 'force-dynamic'

// Define the POST request handler for this API route
export async function POST(request) {
  // Get the form data from the request
  const formData = await request.formData()

  // Get the file from the form data
  const file = formData.get('file')

  // If no file is provided, return an error response
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Convert the file to a buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Define the directory where the uploaded files will be stored
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  // Create the directory if it doesn't exist
  await fs.mkdir(uploadDir, { recursive: true })

  // Get the file extension and base name from the file name
  const ext = file.name?.split('.').pop() || 'bin'
  const base = file.name?.split('.').slice(0,-1).join('.') || 'upload'

  // Replace any non-alphanumeric characters in the base name with underscores
  const safeBase = base.replace(/[^a-z0-9-_]/gi, '_')

  // Generate the filename for the uploaded file
  const filename = `${Date.now()}_${safeBase}.${ext}`

  // Generate the file path for the uploaded file
  const filepath = path.join(uploadDir, filename)

  // Write the buffer to the file
  await fs.writeFile(filepath, buffer)

  // Generate the URL for the uploaded file
  const url = `/uploads/${filename}`

  return NextResponse.json({ url })
}

// Define the GET request handler for this API route
export async function GET() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    await fs.mkdir(uploadDir, { recursive: true })
    const entries = await fs.readdir(uploadDir)
    const urls = entries
      .filter(name => !name.startsWith('.'))
      .map(name => `/uploads/${name}`)
    return NextResponse.json({ urls })
  } catch {
    return NextResponse.json({ urls: [] })
  }
}
