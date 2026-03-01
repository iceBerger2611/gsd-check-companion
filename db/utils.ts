

export const identifySupabaseError = (error: any) => {
  if (!error) return null

  switch (error.code) {
    case '23505':
      return { status: 409, message: 'Resource already exists' }

    case '23503':
      return { status: 400, message: 'Invalid reference' }

    case '23502':
      return { status: 400, message: 'Missing required field' }

    case '23514':
      return { status: 400, message: 'Invalid data' }

    case '22P02':
      return { status: 400, message: 'Invalid ID format' }

    case '22001':
      return { status: 400, message: 'Value too long' }

    default:
      return { status: 500, message: 'Database error' }
  }
}